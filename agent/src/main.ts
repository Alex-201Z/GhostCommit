import { app, BrowserWindow, Tray, Menu, dialog, shell, type Event } from 'electron';
import * as path from 'path';
import { ConfigManager } from './utils/config';
import { ApiClient } from './services/apiClient';
import { FileWatcher } from './services/fileWatcher';
import { GitDetector } from './services/gitDetector';
import { StorageService } from './services/storage';
import { ActivityTracker } from './services/activityTracker';
import { getStartupPolicy } from './services/startupPolicy';
import { AgentCredentialStore } from './services/agentCredentials';
import { AgentHeartbeatService } from './services/agentHeartbeat';
import { AgentLinkingService } from './services/agentLinking';
import { AgentLinkFlow } from './services/agentLinkFlow';
import { extractGhostCommitLink, GhostCommitProtocolHandler } from './services/agentProtocol';
import { AgentConnectionControlService } from './services/agentConnectionControl';
import { createPrivacySafeWatchControls } from './services/trayPrivacy';
import { ProjectSelectionService, type ProjectAuthorizationDraft } from './services/projectSelection';
import { ProjectAuthorizationFlow } from './services/projectAuthorizationFlow';
import { LocalProjectAuthorizationStore } from './services/projectAuthorizationStore';

class GhostCommitAgent {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private config: ConfigManager;
  private apiClient: ApiClient;
  private fileWatcher: FileWatcher;
  private gitDetector: GitDetector;
  private storage: StorageService;
  private activityTracker: ActivityTracker;
  private credentials: AgentCredentialStore;
  private heartbeat: AgentHeartbeatService;
  private linkFlow: AgentLinkFlow;
  private protocolHandler: GhostCommitProtocolHandler;
  private connectionControl: AgentConnectionControlService;
  private projectSelection: ProjectSelectionService;
  private projectAuthorizationFlow: ProjectAuthorizationFlow;
  private projectAuthorizationStore: LocalProjectAuthorizationStore;

  constructor() {
    this.config = new ConfigManager();
    this.apiClient = new ApiClient(this.config);
    this.fileWatcher = new FileWatcher();
    this.gitDetector = new GitDetector();
    this.storage = new StorageService();
    this.credentials = new AgentCredentialStore();
    this.activityTracker = new ActivityTracker(
      this.fileWatcher,
      this.gitDetector,
      this.apiClient,
      this.storage,
    );
    const linking = new AgentLinkingService({
      confirmLink: (payload, userAccessToken) => this.apiClient.confirmAgentLink(payload, userAccessToken),
      saveDeviceToken: (agentToken) => this.credentials.saveDeviceToken(agentToken),
    });
    this.heartbeat = new AgentHeartbeatService({
      getDeviceToken: () => this.credentials.getDeviceToken(),
      heartbeat: (agentToken) => this.apiClient.sendAgentHeartbeat(agentToken),
    });
    this.connectionControl = new AgentConnectionControlService({
      clearDeviceToken: () => this.credentials.clearDeviceToken(),
      clearUserToken: () => this.config.setToken(''),
      stopWatching: () => this.fileWatcher.stopAll(),
      stopActivityTracking: () => this.activityTracker.stop(),
    });
    this.projectSelection = new ProjectSelectionService();
    this.projectAuthorizationStore = new LocalProjectAuthorizationStore(app.getPath('userData'));
    this.projectAuthorizationFlow = new ProjectAuthorizationFlow({
      selection: this.projectSelection,
      createProject: (payload, userAccessToken) => this.apiClient.createProject(payload, userAccessToken),
      saveAuthorizedProject: (mapping) =>
        this.projectAuthorizationStore.saveAuthorizedProject(mapping),
      requestUserConfirmation: (draft) => this.requestProjectAuthorizationConfirmation(draft),
    });
    this.linkFlow = new AgentLinkFlow({
      confirmLink: (input, options) => linking.confirmLink(input, options),
      sendHeartbeat: () => this.heartbeat.sendHeartbeat(),
      requestUserConfirmation: (linkCode) => this.requestAgentLinkConfirmation(linkCode),
    });
    this.protocolHandler = new GhostCommitProtocolHandler((linkUrl) => this.handleAgentLink(linkUrl));

    this.setupActivityTrackerListeners();
  }

  async initialize(): Promise<void> {
    // Create system tray
    this.createTray();

    // Phase 3C privacy boundary: never start watching previous local paths
    // automatically. A later explicit activation flow may opt into watching.
    const watchPaths = this.config.getWatchPaths();
    const startupPolicy = getStartupPolicy(watchPaths);
    if (startupPolicy.shouldAutoWatchConfiguredPaths) {
      watchPaths.forEach((path) => this.fileWatcher.watchPath(path));
    } else if (startupPolicy.shouldShowSetupPrompt) {
      // If no paths configured, show setup dialog
      this.showSetupDialog();
    }

    await this.protocolHandler.markReady();
  }

  receiveProtocolLink(linkUrl: string): void {
    this.protocolHandler.receive(linkUrl);
  }

  private createTray(): void {
    // Use a simple icon for now (you'd use a real icon in production)
    const iconPath = path.join(__dirname, '../assets/icon.png');

    this.tray = new Tray(iconPath);
    this.updateTrayMenu();

    this.tray.setToolTip('GhostCommit Agent');
    this.tray.on('click', () => {
      this.showDashboard();
    });
  }

  private updateTrayMenu(): void {
    if (!this.tray) return;

    const isAuthenticated = this.apiClient.isAuthenticated();
    const activeSession = this.activityTracker.getActiveSession();
    const watchedPaths = this.fileWatcher.getWatchedPaths();
    const watchControls = createPrivacySafeWatchControls(watchedPaths, {
      openFolder: (localPath) => shell.showItemInFolder(localPath),
    });

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'GhostCommit Agent',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: isAuthenticated ? '✓ Connecté' : '✗ Non connecté',
        enabled: false,
      },
      {
        label: activeSession ? '● Session active' : '○ Inactif',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Ouvrir le tableau de bord',
        click: () => this.showDashboard(),
      },
      {
        label: watchControls.watchSummary.label,
        submenu: watchControls.watchSummary.items,
      },
      {
        label: watchControls.addProjectLabel,
        click: () => void this.authorizeLocalGitProject(),
      },
      { type: 'separator' },
      {
        label: isAuthenticated ? 'Se déconnecter' : 'Se connecter',
        click: () => (isAuthenticated ? void this.logout() : this.login()),
      },
      {
        label: 'Effacer la liaison agent locale',
        click: () => void this.disconnectLocalAgent(),
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => this.quit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private setupActivityTrackerListeners(): void {
    this.activityTracker.on('sessionStarted', () => {
      console.log('Activity session started');
      this.updateTrayMenu();
    });

    this.activityTracker.on('sessionEnded', (data) => {
      console.log('Activity session ended:', data);
      this.updateTrayMenu();
    });

    this.activityTracker.on('activity', (data) => {
      // Update tray icon or tooltip to show activity
      if (this.tray) {
        this.tray.setToolTip(
          `GhostCommit Agent - ${data.fileCount} fichiers modifiés`,
        );
      }
    });
  }

  private async requestAgentLinkConfirmation(linkCode: string) {
    const userAccessToken = this.config.getToken();
    if (!userAccessToken) {
      await dialog.showMessageBox({
        type: 'warning',
        title: 'Connexion requise',
        message: 'Connectez-vous au dashboard avant de lier cet agent. Aucune collecte n’a été démarrée.',
      });
      return { confirmed: false };
    }

    const result = await dialog.showMessageBox({
      type: 'question',
      title: 'Lier cet agent GhostCommit',
      message:
        'Confirmez la liaison de cet agent local. GhostCommit ne démarrera pas de surveillance ni de synchronisation de sessions.',
      detail: `Code de liaison : ${linkCode}`,
      buttons: ['Lier cet agent', 'Annuler'],
      defaultId: 0,
      cancelId: 1,
    });

    return {
      confirmed: result.response === 0,
      userAccessToken,
      deviceLabel: 'GhostCommit local agent',
      osFamily: this.getOsFamily(),
      agentVersion: app.getVersion(),
    };
  }

  private async handleAgentLink(linkUrl: string): Promise<void> {
    const result = await this.linkFlow.handleLink(linkUrl);
    if (result.status === 'linked') {
      this.updateTrayMenu();
      await dialog.showMessageBox({
        type: 'info',
        title: 'Agent lié',
        message: 'L’agent est lié. Aucune collecte n’a été démarrée.',
      });
      return;
    }

    if (result.status === 'error') {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Liaison impossible',
        message: result.message,
      });
    }
  }

  private getOsFamily(): 'windows' | 'macos' | 'linux' {
    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'macos';
    return 'linux';
  }

  private showProjectAuthorizationGuidance(): void {
    void dialog
      .showMessageBox({
        type: 'info',
        title: 'Autorisation de projet requise',
        message:
          'La sélection locale de dossiers sera disponible uniquement via le flux explicite d’autorisation de projet. Aucune surveillance n’a été démarrée.',
        buttons: ['Ouvrir le dashboard', 'Plus tard'],
      })
      .then((result) => {
        if (result.response === 0) {
          this.showDashboard();
        }
      });
  }

  private showSetupDialog(): void {
    this.showProjectAuthorizationGuidance();
  }

  private async authorizeLocalGitProject(): Promise<void> {
    const result = await dialog.showOpenDialog({
      title: 'Choisir un projet Git à autoriser',
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return;
    }

    const authorization = await this.projectAuthorizationFlow.authorizeLocalProject(result.filePaths[0]);
    if (authorization.status === 'created') {
      this.updateTrayMenu();
      await dialog.showMessageBox({
        type: 'info',
        title: 'Projet autorisé',
        message:
          'Le projet Git local est autorisé dans GhostCommit. Aucune surveillance ni synchronisation de sessions n’a été démarrée.',
      });
      return;
    }

    if (authorization.status === 'error') {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Autorisation impossible',
        message: authorization.message,
      });
    }
  }

  private async requestProjectAuthorizationConfirmation(draft: ProjectAuthorizationDraft) {
    const userAccessToken = this.config.getToken();
    if (!userAccessToken) {
      await dialog.showMessageBox({
        type: 'warning',
        title: 'Connexion requise',
        message: 'Connectez-vous au dashboard avant d’autoriser un projet local.',
        detail: 'Aucune surveillance ni synchronisation de sessions n’a été démarrée.',
      });
      return { confirmed: false };
    }

    const detail = [
      `Nom affiché : ${draft.apiPayload.displayName}`,
      `Alias local : ${draft.apiPayload.localAlias}`,
      `Patterns ignorés localement : ${draft.apiPayload.ignoredPatterns.length}`,
      draft.apiPayload.branch ? `Branche détectée : ${draft.apiPayload.branch}` : undefined,
      'Aucun chemin absolu, contenu de fichier, hostname ou token ne sera envoyé.',
      'Aucune surveillance ni synchronisation de sessions ne démarrera.',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await dialog.showMessageBox({
      type: 'question',
      title: 'Autoriser ce projet Git local',
      message: `Autoriser “${draft.apiPayload.displayName}” dans GhostCommit ?`,
      detail,
      buttons: ['Autoriser ce projet', 'Annuler'],
      defaultId: 0,
      cancelId: 1,
    });

    return {
      confirmed: result.response === 0,
      userAccessToken,
    };
  }

  private showDashboard(): void {
    const apiUrl = this.config.get().apiUrl.replace('/api/v1', '');
    shell.openExternal(`${apiUrl}/dashboard`);
  }

  private login(): void {
    const apiUrl = this.config.get().apiUrl.replace('/api/v1', '');
    shell.openExternal(`${apiUrl}/auth/github`);

    dialog.showMessageBox({
      type: 'info',
      title: 'Connexion',
      message:
        'Veuillez vous connecter dans votre navigateur.\nCopiez ensuite votre token d\'authentification.',
      buttons: ['J\'ai mon token', 'Annuler'],
    }).then(async (result) => {
      if (result.response === 0) {
        const tokenResult = await dialog.showMessageBox({
          type: 'question',
          title: 'Token d\'authentification',
          message: 'Collez votre token:',
          buttons: ['OK', 'Annuler'],
        });

        // In a real app, you'd use a proper input dialog
        // For now, this is a placeholder
        console.log('Token input needed - implement proper dialog');
      }
    });
  }

  private async disconnectLocalAgent(): Promise<void> {
    await this.connectionControl.disconnectLocalAgent();
    this.updateTrayMenu();

    await dialog.showMessageBox({
      type: 'info',
      title: 'Liaison locale effacée',
      message:
        'La liaison locale de l’agent a été effacée et les surveillances actives ont été arrêtées. Aucune collecte n’a été démarrée.',
    });
  }

  private async logout(): Promise<void> {
    await this.disconnectLocalAgent();
  }

  private quit(): void {
    console.log('Shutting down GhostCommit Agent');
    this.activityTracker.stop();
    this.fileWatcher.stopAll();
    app.quit();
  }
}

// App lifecycle
app.whenReady().then(() => {
  const agent = new GhostCommitAgent();
  app.setAsDefaultProtocolClient('ghostcommit');

  app.on('open-url', (event, linkUrl) => {
    event.preventDefault();
    agent.receiveProtocolLink(linkUrl);
  });

  const startupLink = extractGhostCommitLink(process.argv);
  if (startupLink) {
    agent.receiveProtocolLink(startupLink);
  }

  const hasLock = app.requestSingleInstanceLock();
  if (hasLock) {
    app.on('second-instance', (_event, argv) => {
      const linkUrl = extractGhostCommitLink(argv);
      if (linkUrl) {
        agent.receiveProtocolLink(linkUrl);
      }
    });
  }

  void agent.initialize();
});

// Prevent app from closing when all windows are closed (system tray app)
app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

// macOS specific: re-create window when dock icon is clicked
app.on('activate', () => {
  // Nothing to do - we're a tray app
});
