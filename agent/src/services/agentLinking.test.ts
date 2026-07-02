import { describe, expect, it, vi } from 'vitest';
import { AgentLinkingService } from './agentLinking';

describe('AgentLinkingService privacy-safe link confirmation', () => {
  it('extracts a short dashboard link code from a GhostCommit deep link', () => {
    const service = new AgentLinkingService({
      confirmLink: vi.fn(),
    });

    const code = service.parseLinkCode('ghostcommit://agent/link?code=GC-ABCD23');

    expect(code).toBe('GC-ABCD23');
  });

  it('rejects invalid link URLs and codes without returning unsafe query values', () => {
    const service = new AgentLinkingService({
      confirmLink: vi.fn(),
    });

    expect(() => service.parseLinkCode('https://example.test/?code=GC-ABCD23&token=abc')).toThrow(
      'Invalid GhostCommit agent link',
    );
    expect(() => service.parseLinkCode('ghostcommit://agent/link?code=bad-code&hostname=workstation')).toThrow(
      'Invalid GhostCommit agent link',
    );
  });

  it('requires explicit user confirmation before confirming a link code', async () => {
    const confirmLink = vi.fn();
    const service = new AgentLinkingService({ confirmLink });

    await expect(
      service.confirmLink(
        {
          linkCode: 'GC-ABCD23',
          deviceLabel: 'Laptop dev',
          osFamily: 'windows',
          agentVersion: '0.1.0',
          userAccessToken: 'user-session-token',
        },
        { confirmed: false },
      ),
    ).rejects.toThrow('Agent linking requires explicit user confirmation');

    expect(confirmLink).not.toHaveBeenCalled();
  });

  it('confirms with safe metadata only and does not start collection side effects', async () => {
    const confirmLink = vi.fn().mockResolvedValue({
      installation: {
        id: 'agent-1',
        deviceLabel: 'Laptop dev',
        osFamily: 'windows',
        agentVersion: '0.1.0',
        status: 'CONNECTED',
        lastSeenAt: '2026-07-02T12:00:00.000Z',
      },
      agentToken: 'gca_device_token',
      tokenExpiresAt: '2026-10-01T12:00:00.000Z',
    });
    const startWatching = vi.fn();
    const syncSessions = vi.fn();
    const service = new AgentLinkingService({ confirmLink, startWatching, syncSessions });

    const result = await service.confirmLink(
      {
        linkCode: 'GC-ABCD23',
        deviceLabel: 'Laptop dev',
        osFamily: 'windows',
        agentVersion: '0.1.0',
        userAccessToken: 'user-session-token',
      },
      { confirmed: true },
    );

    expect(result.installation.status).toBe('CONNECTED');
    expect(confirmLink).toHaveBeenCalledWith(
      {
        linkCode: 'GC-ABCD23',
        deviceLabel: 'Laptop dev',
        osFamily: 'windows',
        agentVersion: '0.1.0',
      },
      'user-session-token',
    );
    expect(startWatching).not.toHaveBeenCalled();
    expect(syncSessions).not.toHaveBeenCalled();
  });
});
