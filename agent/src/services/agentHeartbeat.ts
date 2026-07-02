import { AgentInstallation } from './agentLinking';

export interface AgentHeartbeatDependencies {
  getDeviceToken: () => Promise<string | null>;
  heartbeat: (agentToken: string) => Promise<AgentInstallation>;
  startWatching?: () => void;
  syncSessions?: () => void;
}

export class AgentHeartbeatService {
  constructor(private readonly dependencies: AgentHeartbeatDependencies) {}

  async sendHeartbeat(): Promise<AgentInstallation> {
    const agentToken = await this.dependencies.getDeviceToken();
    if (!agentToken) {
      throw new Error('Agent device token is not available');
    }

    return this.dependencies.heartbeat(agentToken);
  }
}
