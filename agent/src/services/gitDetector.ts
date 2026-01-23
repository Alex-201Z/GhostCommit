import * as path from 'path';
import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';

export interface GitInfo {
  isRepo: boolean;
  repoPath?: string;
  remoteName?: string;
  remoteUrl?: string;
  currentBranch?: string;
}

export class GitDetector {
  async detectRepo(filePath: string): Promise<GitInfo> {
    try {
      const repoPath = await this.findGitRoot(filePath);

      if (!repoPath) {
        return { isRepo: false };
      }

      const git: SimpleGit = simpleGit(repoPath);

      // Get remote info
      const remotes = await git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin') || remotes[0];

      // Get current branch
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

      return {
        isRepo: true,
        repoPath,
        remoteName: origin?.name,
        remoteUrl: origin?.refs?.fetch || origin?.refs?.push,
        currentBranch: branch.trim(),
      };
    } catch (error) {
      console.error('Error detecting git repo:', error);
      return { isRepo: false };
    }
  }

  async getCommitCount(repoPath: string, since: Date): Promise<number> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const log = await git.log({
        '--since': since.toISOString(),
      });
      return log.total;
    } catch (error) {
      console.error('Error getting commit count:', error);
      return 0;
    }
  }

  async getDiff(repoPath: string): Promise<{ added: number; deleted: number }> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const diff = await git.diff(['--numstat']);

      let added = 0;
      let deleted = 0;

      if (diff) {
        const lines = diff.split('\n').filter((l) => l.trim());
        lines.forEach((line) => {
          const parts = line.split('\t');
          if (parts.length >= 2) {
            added += parseInt(parts[0]) || 0;
            deleted += parseInt(parts[1]) || 0;
          }
        });
      }

      return { added, deleted };
    } catch (error) {
      console.error('Error getting diff:', error);
      return { added: 0, deleted: 0 };
    }
  }

  private async findGitRoot(startPath: string): Promise<string | null> {
    let currentPath = fs.statSync(startPath).isDirectory() ? startPath : path.dirname(startPath);

    while (currentPath !== path.parse(currentPath).root) {
      const gitPath = path.join(currentPath, '.git');
      if (fs.existsSync(gitPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    return null;
  }

  extractRepoIdentifier(remoteUrl: string): string | null {
    // Extract owner/repo from GitHub or GitLab URL
    const patterns = [
      /github\.com[:/](.+?)\.git$/,
      /github\.com[:/](.+?)$/,
      /gitlab\.com[:/](.+?)\.git$/,
      /gitlab\.com[:/](.+?)$/,
    ];

    for (const pattern of patterns) {
      const match = remoteUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}
