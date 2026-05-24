import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { GITHUB_SCOPES } from './auth.constants';
import { GithubProfile } from './auth.type';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  /** PassportStrategy is a function that returns a class. I extend it, pass my GitHub config in super(), and validate() gives me the user profile.*/
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID')!,
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL')!,
      scope: GITHUB_SCOPES,
    });
  }

  validate(accessToken: string, refreshToken: string, profile: GithubProfile) {
    return {
      githubId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      emails: profile.emails,
      avatar: profile.photos?.[0]?.value,
      accessToken,
    };
  }
}
