import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth flow' })
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.validateOrCreateGithubUser(req.user);
    const token = await this.authService.generateToken(user);

    // Redirect to frontend with token
    const redirectUrl = `${process.env.API_URL || 'http://localhost:3000'}/auth/success?token=${token.access_token}`;
    res.redirect(redirectUrl);
  }

  @Get('gitlab')
  @UseGuards(AuthGuard('gitlab'))
  @ApiOperation({ summary: 'Initiate GitLab OAuth flow' })
  async gitlabAuth() {
    // Guard redirects to GitLab
  }

  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  @ApiOperation({ summary: 'GitLab OAuth callback' })
  async gitlabAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.validateOrCreateGitlabUser(req.user);
    const token = await this.authService.generateToken(user);

    // Redirect to frontend with token
    const redirectUrl = `${process.env.API_URL || 'http://localhost:3000'}/auth/success?token=${token.access_token}`;
    res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@Req() req: Request) {
    return req.user;
  }
}
