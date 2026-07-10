import { describe, expect, it, vi } from 'vitest';
import { AgentLinkFlow } from './agentLinkFlow';

describe('AgentLinkFlow', () => {
  it('does not confirm, heartbeat, watch or sync when the user cancels the link prompt', async () => {
    const confirmLink = vi.fn();
    const sendHeartbeat = vi.fn();
    const startWatching = vi.fn();
    const syncSessions = vi.fn();
    const flow = new AgentLinkFlow({
      confirmLink,
      sendHeartbeat,
      requestUserConfirmation: vi.fn().mockResolvedValue({ confirmed: false }),
      startWatching,
      syncSessions,
    });

    const result = await flow.handleLink('ghostcommit://agent/link?code=GC-ABCD23');

    expect(result.status).toBe('cancelled');
    expect(confirmLink).not.toHaveBeenCalled();
    expect(sendHeartbeat).not.toHaveBeenCalled();
    expect(startWatching).not.toHaveBeenCalled();
    expect(syncSessions).not.toHaveBeenCalled();
  });

  it('confirms with user-approved metadata and sends one explicit heartbeat without collection side effects', async () => {
    const confirmLink = vi.fn().mockResolvedValue({
      installation: {
        id: 'agent-1',
        deviceLabel: 'Laptop dev',
        status: 'CONNECTED',
      },
      agentToken: 'gca_device_token',
      tokenExpiresAt: '2026-10-01T12:00:00.000Z',
    });
    const sendHeartbeat = vi.fn().mockResolvedValue({
      id: 'agent-1',
      deviceLabel: 'Laptop dev',
      status: 'CONNECTED',
    });
    const startWatching = vi.fn();
    const syncSessions = vi.fn();
    const flow = new AgentLinkFlow({
      confirmLink,
      sendHeartbeat,
      requestUserConfirmation: vi.fn().mockResolvedValue({
        confirmed: true,
        userAccessToken: 'user-session-token',
        deviceLabel: 'Laptop dev',
        osFamily: 'windows',
        agentVersion: '0.1.0',
      }),
      startWatching,
      syncSessions,
    });

    const result = await flow.handleLink('ghostcommit://agent/link?code=GC-ABCD23');

    expect(result.status).toBe('linked');
    expect(confirmLink).toHaveBeenCalledWith(
      {
        linkCode: 'GC-ABCD23',
        deviceLabel: 'Laptop dev',
        osFamily: 'windows',
        agentVersion: '0.1.0',
        userAccessToken: 'user-session-token',
      },
      { confirmed: true },
    );
    expect(sendHeartbeat).toHaveBeenCalledTimes(1);
    expect(startWatching).not.toHaveBeenCalled();
    expect(syncSessions).not.toHaveBeenCalled();
  });

  it('reports invalid links generically without echoing query values', async () => {
    const flow = new AgentLinkFlow({
      confirmLink: vi.fn(),
      sendHeartbeat: vi.fn(),
      requestUserConfirmation: vi.fn(),
    });

    const result = await flow.handleLink('ghostcommit://agent/link?code=bad-code&hostname=workstation');

    expect(result).toEqual({ status: 'error', message: 'Invalid GhostCommit agent link' });
  });
});
