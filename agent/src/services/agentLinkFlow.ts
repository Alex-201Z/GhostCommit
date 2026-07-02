import {
  AgentInstallation,
  AgentLinkConfirmation,
  AgentLinkConfirmationInput,
  AgentLinkConfirmationOptions,
  AgentLinkingService,
} from './agentLinking';

export interface LinkConfirmationPromptResult {
  confirmed: boolean;
  userAccessToken?: string;
  deviceLabel?: string;
  osFamily?: string;
  agentVersion?: string;
}

export type AgentLinkFlowResult =
  | { status: 'cancelled' }
  | { status: 'linked'; installation: AgentInstallation; heartbeat: AgentInstallation }
  | { status: 'error'; message: string };

export interface AgentLinkFlowDependencies {
  confirmLink: (
    input: AgentLinkConfirmationInput,
    options: AgentLinkConfirmationOptions,
  ) => Promise<AgentLinkConfirmation>;
  sendHeartbeat: () => Promise<AgentInstallation>;
  requestUserConfirmation: (linkCode: string) => Promise<LinkConfirmationPromptResult>;
  startWatching?: () => void;
  syncSessions?: () => void;
}

export class AgentLinkFlow {
  private readonly parser = new AgentLinkingService({
    confirmLink: async () => {
      throw new Error('Agent link parser must not confirm links');
    },
  });

  constructor(private readonly dependencies: AgentLinkFlowDependencies) {}

  async handleLink(linkUrl: string): Promise<AgentLinkFlowResult> {
    let linkCode: string;
    try {
      linkCode = this.parser.parseLinkCode(linkUrl);
    } catch {
      return { status: 'error', message: 'Invalid GhostCommit agent link' };
    }

    const confirmation = await this.dependencies.requestUserConfirmation(linkCode);
    if (!confirmation.confirmed) {
      return { status: 'cancelled' };
    }

    if (!confirmation.userAccessToken || !confirmation.deviceLabel) {
      return { status: 'error', message: 'Agent link confirmation is incomplete' };
    }

    const linked = await this.dependencies.confirmLink(
      {
        linkCode,
        userAccessToken: confirmation.userAccessToken,
        deviceLabel: confirmation.deviceLabel,
        ...(confirmation.osFamily ? { osFamily: confirmation.osFamily } : {}),
        ...(confirmation.agentVersion ? { agentVersion: confirmation.agentVersion } : {}),
      },
      { confirmed: true },
    );
    const heartbeat = await this.dependencies.sendHeartbeat();

    return {
      status: 'linked',
      installation: linked.installation,
      heartbeat,
    };
  }
}
