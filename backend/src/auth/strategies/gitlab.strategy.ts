import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-gitlab2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitlabStrategy extends PassportStrategy(Strategy, 'gitlab') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GITLAB_CLIENT_ID'),
      clientSecret: configService.get('GITLAB_CLIENT_SECRET'),
      callbackURL: configService.get('GITLAB_CALLBACK_URL'),
      scope: ['read_user', 'read_api'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const { id, username, displayName, emails, avatarUrl } = profile;

    return {
      gitlabId: String(id),
      username: username,
      name: displayName,
      email: emails?.[0]?.value,
      avatarUrl: avatarUrl,
      accessToken,
    };
  }
}
