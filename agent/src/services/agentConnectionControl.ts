export type AgentDisconnectResult = { status: 'disconnected' };

export interface AgentConnectionControlDependencies {
  clearDeviceToken: () => Promise<void>;
  clearUserToken: () => void;
  stopWatching: () => void;
  stopActivityTracking: () => void;
  startWatching?: () => void;
  syncSessions?: () => void;
  sendHeartbeat?: () => Promise<unknown>;
  revokeRemoteInstallation?: () => Promise<unknown>;
}

export class AgentConnectionControlService {
  constructor(private readonly dependencies: AgentConnectionControlDependencies) {}

  async disconnectLocalAgent(): Promise<AgentDisconnectResult> {
    this.dependencies.stopActivityTracking();
    this.dependencies.stopWatching();
    this.dependencies.clearUserToken();
    await this.dependencies.clearDeviceToken();

    return { status: 'disconnected' };
  }
}
