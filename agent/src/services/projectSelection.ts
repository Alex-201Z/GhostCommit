import * as fs from 'fs';
import * as path from 'path';

export const DEFAULT_AGENT_IGNORED_PATTERNS = [
  '.git/**',
  'node_modules/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.env*',
  '*.pem',
  '*.key',
  'secrets/**',
  'private/**',
];

export interface ProjectCreatePayload {
  displayName: string;
  gitProvider: 'LOCAL';
  localAlias: string;
  branch?: string;
  ignoredPatterns: string[];
}

export interface ProjectAuthorizationDraft {
  localRootPath: string;
  requiresUserConfirmation: true;
  apiPayload: ProjectCreatePayload;
}

export interface ProjectSelectionOptions {
  ignoredPatterns?: string[];
  branch?: string;
}

export interface ProjectConfirmationOptions {
  confirmed: boolean;
}

const SAFE_IGNORE_PATTERN = /^[A-Za-z0-9._*/!-]{1,120}$/;

export class ProjectSelectionService {
  async createAuthorizationDraft(
    folderPath: string,
    options: ProjectSelectionOptions = {},
  ): Promise<ProjectAuthorizationDraft> {
    const localRootPath = path.resolve(folderPath);

    if (!this.isGitRepositoryRoot(localRootPath)) {
      throw new Error('Only Git repository folders can be selected');
    }

    const displayName = this.toDisplayName(localRootPath);
    const ignoredPatterns = this.normalizeIgnoredPatterns(options.ignoredPatterns ?? []);

    return {
      localRootPath,
      requiresUserConfirmation: true,
      apiPayload: {
        displayName,
        gitProvider: 'LOCAL',
        localAlias: this.toSafeAlias(displayName),
        ...(options.branch ? { branch: options.branch } : {}),
        ignoredPatterns,
      },
    };
  }

  toCreateProjectPayload(
    draft: ProjectAuthorizationDraft,
    options: ProjectConfirmationOptions,
  ): ProjectCreatePayload {
    if (!options.confirmed) {
      throw new Error('Project tracking requires explicit user confirmation');
    }

    return { ...draft.apiPayload, ignoredPatterns: [...draft.apiPayload.ignoredPatterns] };
  }

  private isGitRepositoryRoot(folderPath: string): boolean {
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      return false;
    }

    return fs.existsSync(path.join(folderPath, '.git'));
  }

  private toDisplayName(localRootPath: string): string {
    const baseName = path.basename(localRootPath).trim();
    return baseName || 'Local project';
  }

  private toSafeAlias(displayName: string): string {
    const normalized = displayName
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N} ._-]/gu, '-')
      .replace(/\s+/g, ' ')
      .trim();

    const alias = normalized.length >= 2 ? normalized : 'Local project';
    return alias.slice(0, 80);
  }

  private normalizeIgnoredPatterns(userPatterns: string[]): string[] {
    const safeUserPatterns = userPatterns.filter((pattern) => this.isSafeIgnoredPattern(pattern));
    return [...new Set([...DEFAULT_AGENT_IGNORED_PATTERNS, ...safeUserPatterns])];
  }

  private isSafeIgnoredPattern(pattern: string): boolean {
    const trimmed = pattern.trim();

    if (!SAFE_IGNORE_PATTERN.test(trimmed)) {
      return false;
    }

    if (
      trimmed.includes('\\') ||
      trimmed.includes('..') ||
      trimmed.startsWith('/') ||
      path.isAbsolute(trimmed) ||
      /^[A-Za-z]:/.test(trimmed)
    ) {
      return false;
    }

    return true;
  }
}
