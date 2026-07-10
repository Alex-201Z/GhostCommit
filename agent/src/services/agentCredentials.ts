const SERVICE_NAME = 'GhostCommit Agent';
const DEVICE_TOKEN_ACCOUNT = 'device-token';

export interface SecretVault {
  setPassword(service: string, account: string, password: string): Promise<void>;
  getPassword(service: string, account: string): Promise<string | null>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

export class KeytarSecretVault implements SecretVault {
  async setPassword(service: string, account: string, password: string): Promise<void> {
    const keytar = await import('keytar');
    return keytar.default.setPassword(service, account, password);
  }

  async getPassword(service: string, account: string): Promise<string | null> {
    const keytar = await import('keytar');
    return keytar.default.getPassword(service, account);
  }

  async deletePassword(service: string, account: string): Promise<boolean> {
    const keytar = await import('keytar');
    return keytar.default.deletePassword(service, account);
  }
}

export class AgentCredentialStore {
  constructor(private readonly vault: SecretVault = new KeytarSecretVault()) {}

  async saveDeviceToken(agentToken: string): Promise<void> {
    await this.vault.setPassword(SERVICE_NAME, DEVICE_TOKEN_ACCOUNT, agentToken);
  }

  getDeviceToken(): Promise<string | null> {
    return this.vault.getPassword(SERVICE_NAME, DEVICE_TOKEN_ACCOUNT);
  }

  async clearDeviceToken(): Promise<void> {
    await this.vault.deletePassword(SERVICE_NAME, DEVICE_TOKEN_ACCOUNT);
  }
}
