import { describe, expect, it, vi } from 'vitest';
import { AgentCredentialStore, SecretVault } from './agentCredentials';

function createVault(): SecretVault {
  return {
    setPassword: vi.fn(),
    getPassword: vi.fn(),
    deletePassword: vi.fn(),
  };
}

describe('AgentCredentialStore', () => {
  it('stores the device token through an injected secure vault only', async () => {
    const vault = createVault();
    const store = new AgentCredentialStore(vault);

    await store.saveDeviceToken('gca_device_token');

    expect(vault.setPassword).toHaveBeenCalledWith('GhostCommit Agent', 'device-token', 'gca_device_token');
  });

  it('reads and clears the device token without using config persistence', async () => {
    const vault = createVault();
    vi.mocked(vault.getPassword).mockResolvedValue('gca_device_token');
    const store = new AgentCredentialStore(vault);

    await expect(store.getDeviceToken()).resolves.toBe('gca_device_token');
    await store.clearDeviceToken();

    expect(vault.getPassword).toHaveBeenCalledWith('GhostCommit Agent', 'device-token');
    expect(vault.deletePassword).toHaveBeenCalledWith('GhostCommit Agent', 'device-token');
  });
});
