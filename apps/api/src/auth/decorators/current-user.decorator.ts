import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import type { CurrentUser as CurrentUserType } from '../types/current-user.type';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType | null => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.currentUser ?? request.user;

    if (!user) {
      throw new UnauthorizedException('CURRENT_USER_NOT_AVAILABLE');
    }

    return user;
  },
);

