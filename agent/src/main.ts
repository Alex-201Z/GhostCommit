import { app, BrowserWindow, Tray, Menu, dialog, shell, type Event } from 'electron';
import * as path from 'path';
import { ConfigManager } from './utils/config';
import { ApiClient } from './services/apiClient';
import { FileWatcher } from './services/fileWatcher';
import { GitDetector } from './services/gitDetector';
import { StorageService } from './services/storage';
import { ActivityTracker } from './services/activityTracker';
import { getStartupPolicy } from './services/startupPolicy';

class GhostCommitAgent {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private config: ConfigManager;
  private apiClient: ApiClient;
  private fileWatcher: FileWatcher;
  private gitDetector: GitDetector;
  private storage: StorageService;
  private activityTracker: ActivityTracker;

  constructor() {
    this.config = new ConfigManager();
    this.apiClient = new ApiClient(this.config);
    this.fileWatcher = new FileWatcher();
    this.gitDetector = new GitDetector();
    this.storage = new StorageService();
    this.activityTracker = new ActivityTracker(
      this.fileWatcher,
      this.gitDetector,
      this.apiClient,
      this.storage,
    );

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
        label: `Dossiers surveillés (${watchedPaths.length})`,
        submenu: watchedPaths.length > 0
          ? watchedPaths.map((p) => ({
              label: p,
              click: () => shell.showItemInFolder(p),
            }))
          : [{ label: 'Aucun dossier', enabled: false }],
      },
      {
        label: 'Ajouter un dossier',
        click: () => this.addWatchFolder(),
      },
      { type: 'separator' },
      {
        label: isAuthenticated ? 'Se déconnecter' : 'Se connecter',
        click: () => (isAuthenticated ? this.logout() : this.login()),
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

  private async addWatchFolder(): Promise<void> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Sélectionner un dossier à surveiller',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      this.config.addWatchPath(folderPath);
      this.fileWatcher.watchPath(folderPath);
      this.updateTrayMenu();

      dialog.showMessageBox({
        type: 'info',
        title: 'Dossier ajouté',
        message: `Le dossier est maintenant surveillé:\n${folderPath}`,
      });
    }
  }

  private showSetupDialog(): void {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Bienvenue sur GhostCommit',
        message:
          'Pour commencer, ajoutez les dossiers de vos projets que vous souhaitez surveiller.',
        buttons: ['Ajouter un dossier', 'Plus tard'],
      })
      .then((result) => {
        if (result.response === 0) {
          this.addWatchFolder();
        }
      });
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

  private logout(): void {
    this.config.setToken('');
    this.updateTrayMenu();

    dialog.showMessageBox({
      type: 'info',
      title: 'Déconnexion',
      message: 'Vous avez été déconnecté.',
    });
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
  agent.initialize();
});

// Prevent app from closing when all windows are closed (system tray app)
app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

// macOS specific: re-create window when dock icon is clicked
app.on('activate', () => {
  // Nothing to do - we're a tray app
});
