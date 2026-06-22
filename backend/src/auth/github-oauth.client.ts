import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GithubProfile {
  githubId: string;
  email: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
}

@Injectable()
export class GithubOAuthClient {
  constructor(private readonly config: ConfigService) {}

  authorizationUrl(state: string): string {
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const callback = this.config.get<string>('GITHUB_CALLBACK_URL');
    if (!clientId || !callback)
      throw new ServiceUnavailableException('GitHub OAuth is not configured');
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callback);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', state);
    return url.toString();
  }

  async exchange(code: string): Promise<GithubProfile> {
    try {
      const token = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.config.get<string>('GITHUB_CLIENT_ID'),
          client_secret: this.config.get<string>('GITHUB_CLIENT_SECRET'),
          code,
          redirect_uri: this.config.get<string>('GITHUB_CALLBACK_URL'),
        },
        { headers: { Accept: 'application/json' } },
      );
      const accessToken = token.data?.access_token as string | undefined;
      if (!accessToken) throw new Error('exchange failed');
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      };
      const profile = await axios.get('https://api.github.com/user', { headers });
      const emails = await axios.get('https://api.github.com/user/emails', { headers });
      const email = emails.data?.find(
        (item: { primary?: boolean; verified?: boolean }) => item.primary && item.verified,
      )?.email as string | undefined;
      if (!email || !profile.data?.id) throw new Error('profile incomplete');
      return {
        githubId: String(profile.data.id),
        email,
        username: profile.data.login,
        name: profile.data.name,
        avatarUrl: profile.data.avatar_url,
      };
    } catch {
      throw new UnauthorizedException('GitHub authentication failed');
    }
  }
}
