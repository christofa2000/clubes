import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AuthUser } from '../interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user) {
      throw new UnauthorizedException('User context is missing');
    }
    return request.user;
  }
);

