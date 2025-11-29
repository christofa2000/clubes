import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from './guards/auth.guard';
import type { CurrentUser as CurrentUserType } from './types/current-user.type';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: CurrentUserType): CurrentUserType {
    return this.authService.getProfile(user);
  }
}

