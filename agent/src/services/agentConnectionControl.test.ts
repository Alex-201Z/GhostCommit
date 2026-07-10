import { describe, expect, it, vi } from 'vitest';
import { AgentConnectionControlService } from './agentConnectionControl';

describe('AgentConnectionControlService', () => {
  it('disconnects the local agent by clearing credentials and stopping local collection only', async () => {
    const clearDeviceToken = vi.fn().mockResolvedValue(undefined);
    const clearUserToken = vi.fn();
    const stopWatching = vi.fn();
    const stopActivityTracking = vi.fn();
    const startWatching = vi.fn();
    const syncSessions = vi.fn();
    const sendHeartbeat = vi.fn();
    const revokeRemoteInstallation = vi.fn();
    const service = new AgentConnectionControlService({
      clearDeviceToken,
      clearUserToken,
      stopWatching,
      stopActivityTracking,
      startWatching,
      syncSessions,
      sendHeartbeat,
      revokeRemoteInstallation,
    });

    const result = await service.disconnectLocalAgent();

    expect(result).toEqual({ status: 'disconnected' });
    expect(clearDeviceToken).toHaveBeenCalledTimes(1);
    expect(clearUserToken).toHaveBeenCalledTimes(1);
    expect(stopActivityTracking).toHaveBeenCalledTimes(1);
    expect(stopWatching).toHaveBeenCalledTimes(1);
    expect(startWatching).not.toHaveBeenCalled();
    expect(syncSessions).not.toHaveBeenCalled();
    expect(sendHeartbeat).not.toHaveBeenCalled();
    expect(revokeRemoteInstallation).not.toHaveBeenCalled();
  });
});
