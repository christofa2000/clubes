import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User } from '@prisma/client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUser, TokenIdentity } from './types/current-user.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabase: SupabaseClient | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
      this.logger.warn('[AuthService] Supabase no configurado, se usará fallback local limitado.');
      this.supabase = null;
    } else {
      this.supabase = createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  async resolveCurrentUser(authHeader?: string | string[]): Promise<CurrentUser> {
    const token = this.extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedException('AUTH_TOKEN_MISSING');
    }

    const identity = this.supabase
      ? await this.resolveTokenViaSupabase(token)
      : this.resolveTokenIdentityFallback(token);

    const prismaUser = await this.findUser(identity);

    if (!prismaUser) {
      throw new UnauthorizedException('AUTH_USER_NOT_FOUND');
    }

    return this.mapToCurrentUser(prismaUser);
  }

  getProfile(currentUser: CurrentUser): CurrentUser {
    return currentUser;
  }

  private extractBearerToken(headerValue?: string | string[]): string | null {
    if (Array.isArray(headerValue)) {
      headerValue = headerValue[0];
    }

    if (!headerValue) {
      return null;
    }

    const [type, token] = headerValue.split(' ');

    if (type?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }

  private async resolveTokenViaSupabase(token: string): Promise<TokenIdentity> {
    if (!this.supabase) {
      throw new UnauthorizedException('AUTH_SUPABASE_NOT_CONFIGURED');
    }

    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      this.logger.warn(`Supabase token validation failed: ${error.message}`);
      throw new UnauthorizedException('AUTH_INVALID_TOKEN');
    }

    const user = data.user as typeof data.user | null;

    if (!user) {
      this.logger.warn('Supabase token validation failed: payload missing user');
      throw new UnauthorizedException('AUTH_INVALID_TOKEN');
    }

    return {
      id: user.id,
      email: user.email ?? undefined,
    };
  }

  private resolveTokenIdentityFallback(token: string): TokenIdentity {
    const decoded = this.decodeJwtToken(token);
    if (decoded) {
      return decoded;
    }

    // Mock/fallback: treat the token as a direct user id (useful for local dev)
    return { id: token };
  }

  private decodeJwtToken(token: string): TokenIdentity | null {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    if (!parts[1]) {
      throw new UnauthorizedException('AUTH_TOKEN_MALFORMED');
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        sub?: string;
        email?: string;
        id?: string;
      };

      return {
        id: payload.sub ?? payload.id,
        email: payload.email,
      };
    } catch (error) {
      this.logger.verbose(`JWT decode failed: ${(error as Error).message}`);
      return null;
    }
  }

  private async findUser(identity: TokenIdentity): Promise<Pick<User, 'id' | 'email' | 'role' | 'clubId'> | null> {
    if (!identity.email && !identity.id) {
      return null;
    }

    const where: Prisma.UserWhereInput = identity.email
      ? { email: identity.email }
      : { id: identity.id as string };

    return this.prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        clubId: true,
      },
    });
  }

  private mapToCurrentUser(user: Pick<User, 'id' | 'email' | 'role' | 'clubId'>): CurrentUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId ?? null,
      branchId: null,
    };
  }
}

