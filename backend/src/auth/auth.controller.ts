import { Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GithubCallbackDto } from './dto/github-callback.dto';

const COOKIE = 'ghostcommit_refresh';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('github/start')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a single-use GitHub OAuth authorization state' })
  startGithub() {
    return this.auth.startGithub();
  }

  @Get('github/callback')
  @ApiOperation({ summary: 'Complete GitHub OAuth without exposing tokens in the URL' })
  async githubCallback(@Query() query: GithubCallbackDto, @Res() res: Response) {
    const result = await this.auth.finishGithub(query.code, query.state);
    this.setRefreshCookie(res, result.refreshToken);
    return res.redirect(this.auth.successRedirect);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate refresh token and return a short-lived access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.refresh(this.cookie(req));
    this.setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _secret, ...body } = result;
    return body;
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke the current refresh session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.cookie(req));
    res.clearCookie(COOKIE, { path: '/api/v1/auth' });
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Return the authenticated user' })
  me(@Req() req: Request) {
    return req.user;
  }

  private cookie(req: Request) {
    const raw = req.headers.cookie || '';
    return (
      raw
        .split(';')
        .map((v) => v.trim())
        .find((v) => v.startsWith(`${COOKIE}=`))
        ?.slice(COOKIE.length + 1) || ''
    );
  }
  private setRefreshCookie(res: Response, value: string) {
    res.cookie(COOKIE, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}
