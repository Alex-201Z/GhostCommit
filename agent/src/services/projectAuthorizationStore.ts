import * as fs from 'fs';
import * as path from 'path';

export interface AuthorizedProjectMapping {
  projectId: string;
  displayName: string;
  localAlias: string;
  localRootPath: string;
  collectionEnabled: false;
  authorizedAt: string;
}

export interface SaveAuthorizedProjectInput {
  projectId: string;
  displayName: string;
  localAlias: string;
  localRootPath: string;
}

export class LocalProjectAuthorizationStore {
  private readonly storagePath: string;
  private readonly mappingsPath: string;

  constructor(userDataPath: string) {
    this.storagePath = path.join(userDataPath, 'data');
    this.mappingsPath = path.join(this.storagePath, 'authorized-projects.json');
    this.ensureStorageDirectory();
  }

  saveAuthorizedProject(input: SaveAuthorizedProjectInput): void {
    const mappings = this.listAuthorizedProjects();
    const existingIndex = mappings.findIndex((mapping) => mapping.projectId === input.projectId);
    const existing = existingIndex >= 0 ? mappings[existingIndex] : undefined;
    const mapping: AuthorizedProjectMapping = {
      projectId: input.projectId,
      displayName: input.displayName,
      localAlias: input.localAlias,
      localRootPath: input.localRootPath,
      collectionEnabled: false,
      authorizedAt: existing?.authorizedAt ?? new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      mappings[existingIndex] = mapping;
    } else {
      mappings.push(mapping);
    }

    this.writeAuthorizedProjects(mappings);
  }

  listAuthorizedProjects(): AuthorizedProjectMapping[] {
    try {
      if (fs.existsSync(this.mappingsPath)) {
        const data = fs.readFileSync(this.mappingsPath, 'utf-8');
        return JSON.parse(data) as AuthorizedProjectMapping[];
      }
    } catch (error) {
      console.error('Error reading authorized project mappings:', this.safeErrorLabel(error));
    }

    return [];
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  private writeAuthorizedProjects(mappings: AuthorizedProjectMapping[]): void {
    try {
      fs.writeFileSync(this.mappingsPath, JSON.stringify(mappings, null, 2));
    } catch (error) {
      console.error('Error writing authorized project mappings:', this.safeErrorLabel(error));
    }
  }

  private safeErrorLabel(error: unknown): string {
    return error instanceof Error ? error.name : 'unknown error';
  }
}
