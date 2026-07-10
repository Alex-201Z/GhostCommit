import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
      post,
    })),
  },
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => 'F:\\GhostCommit\\test-user-data'),
  },
}));

import { ApiClient } from './apiClient';
import type { ProjectCreatePayload } from './projectSelection';

describe('ApiClient project authorization', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('posts a safe project creation payload with the explicit user authorization token', async () => {
    const payload: ProjectCreatePayload = {
      displayName: 'client-app',
      gitProvider: 'LOCAL',
      localAlias: 'client-app-a1b2c3d4',
      branch: 'main',
      ignoredPatterns: ['.env', 'node_modules/'],
    };
    const config = {
      get: () => ({ apiUrl: 'http://localhost:3000/api/v1' }),
      getToken: () => 'ambient-token',
      isAuthenticated: () => true,
      setToken: vi.fn(),
    };
    post.mockResolvedValueOnce({ data: { id: 'project_1' } });

    const client = new ApiClient(config as never);
    const result = await client.createProject(payload, 'user_access_token');

    expect(result).toEqual({ id: 'project_1' });
    expect(post).toHaveBeenCalledWith('/projects', payload, {
      headers: {
        Authorization: 'Bearer user_access_token',
      },
    });
    expect(JSON.stringify(post.mock.calls)).not.toMatch(/GhostCommit|test-user-data|Users|client-app[/\\]/);
  });
});
