export interface AgentInstallation {
  id: string;
  deviceLabel: string;
  osFamily?: string | null;
  agentVersion?: string | null;
  status: string;
  lastSeenAt?: string | null;
  revokedAt?: string | null;
}

export interface AgentLinkConfirmation {
  installation: AgentInstallation;
  agentToken: string;
  tokenExpiresAt: string;
}

export interface AgentLinkConfirmPayload {
  linkCode: string;
  deviceLabel: string;
  osFamily?: string;
  agentVersion?: string;
}

export interface AgentLinkConfirmationInput extends AgentLinkConfirmPayload {
  userAccessToken: string;
}

export interface AgentLinkConfirmationOptions {
  confirmed: boolean;
}

export interface AgentLinkingDependencies {
  confirmLink: (payload: AgentLinkConfirmPayload, userAccessToken: string) => Promise<AgentLinkConfirmation>;
  startWatching?: () => void;
  syncSessions?: () => void;
}

const LINK_CODE_PATTERN = /^GC-[A-Z0-9]{6}$/;

export class AgentLinkingService {
  constructor(private readonly dependencies: AgentLinkingDependencies) {}

  parseLinkCode(linkUrl: string): string {
    try {
      const parsed = new URL(linkUrl);
      const code = parsed.searchParams.get('code');

      if (parsed.protocol !== 'ghostcommit:' || parsed.hostname !== 'agent' || parsed.pathname !== '/link') {
        throw new Error('Invalid GhostCommit agent link');
      }

      if (!code || !LINK_CODE_PATTERN.test(code)) {
        throw new Error('Invalid GhostCommit agent link');
      }

      return code;
    } catch {
      throw new Error('Invalid GhostCommit agent link');
    }
  }

  async confirmLink(
    input: AgentLinkConfirmationInput,
    options: AgentLinkConfirmationOptions,
  ): Promise<AgentLinkConfirmation> {
    if (!options.confirmed) {
      throw new Error('Agent linking requires explicit user confirmation');
    }

    const payload: AgentLinkConfirmPayload = {
      linkCode: input.linkCode,
      deviceLabel: input.deviceLabel,
      ...(input.osFamily ? { osFamily: input.osFamily } : {}),
      ...(input.agentVersion ? { agentVersion: input.agentVersion } : {}),
    };

    return this.dependencies.confirmLink(payload, input.userAccessToken);
  }
}
