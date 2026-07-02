import { describe, expect, it, vi } from 'vitest';
import { AgentHeartbeatService } from './agentHeartbeat';

describe('AgentHeartbeatService', () => {
  it('does not heartbeat without an explicitly stored device token', async () => {
    const heartbeat = vi.fn();
    const service = new AgentHeartbeatService({
      getDeviceToken: vi.fn().mockResolvedValue(null),
      heartbeat,
    });

    await expect(service.sendHeartbeat()).rejects.toThrow('Agent device token is not available');

    expect(heartbeat).not.toHaveBeenCalled();
  });

  it('sends heartbeat explicitly with the device token and starts no collection side effects', async () => {
    const heartbeat = vi.fn().mockResolvedValue({
      id: 'agent-1',
      status: 'CONNECTED',
      deviceLabel: 'Laptop dev',
    });
    const startWatching = vi.fn();
    const syncSessions = vi.fn();
    const service = new AgentHeartbeatService({
      getDeviceToken: vi.fn().mockResolvedValue('gca_device_token'),
      heartbeat,
      startWatching,
      syncSessions,
    });

    const result = await service.sendHeartbeat();

    expect(result.status).toBe('CONNECTED');
    expect(heartbeat).toHaveBeenCalledWith('gca_device_token');
    expect(startWatching).not.toHaveBeenCalled();
    expect(syncSessions).not.toHaveBeenCalled();
  });
});
