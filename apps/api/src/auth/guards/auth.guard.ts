import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headers = request.headers as Record<string, string | string[] | undefined>;
    const authorizationHeader = headers.authorization;
    const headerValue = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    const currentUser = await this.authService.resolveCurrentUser(headerValue).catch((error: unknown) => {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('AUTH_INVALID_TOKEN');
    });

    request.currentUser = currentUser;
    request.user = currentUser;

    return true;
  }
}

