import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export interface Config {
  apiUrl: string;
  token: string | null;
  syncInterval: number;
  watchPaths: string[];
  userId: string | null;
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    const defaultConfig: Config = {
      apiUrl: process.env.API_URL || 'http://localhost:3000/api/v1',
      token: null,
      syncInterval: 5 * 60 * 1000, // 5 minutes
      watchPaths: [],
      userId: null,
    };

    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    return defaultConfig;
  }

  saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  get(): Config {
    return { ...this.config };
  }

  set(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getToken(): string | null {
    return this.config.token;
  }

  setToken(token: string): void {
    this.config.token = token;
    this.saveConfig();
  }

  isAuthenticated(): boolean {
    return !!this.config.token;
  }

  addWatchPath(path: string): void {
    if (!this.config.watchPaths.includes(path)) {
      this.config.watchPaths.push(path);
      this.saveConfig();
    }
  }

  removeWatchPath(path: string): void {
    this.config.watchPaths = this.config.watchPaths.filter((p) => p !== path);
    this.saveConfig();
  }

  getWatchPaths(): string[] {
    return [...this.config.watchPaths];
  }
}
