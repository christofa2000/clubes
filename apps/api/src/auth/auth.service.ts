import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUser, TokenIdentity } from './types/current-user.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabaseUrl: string | undefined;
  private readonly supabaseServiceKey: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.supabaseUrl = configService.get<string>('SUPABASE_URL');
    this.supabaseServiceKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  }

  async resolveCurrentUser(authHeader?: string | string[]): Promise<CurrentUser> {
    const token = this.extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedException('AUTH_TOKEN_MISSING');
    }

    const identity = await this.resolveTokenIdentity(token);

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

  private async resolveTokenIdentity(token: string): Promise<TokenIdentity> {
    const supabaseUser = await this.fetchSupabaseUser(token);
    if (supabaseUser) {
      return supabaseUser;
    }

    const decoded = this.decodeJwtToken(token);
    if (decoded) {
      return decoded;
    }

    // Mock/fallback: treat the token as a direct user id (useful for local dev)
    return { id: token };
  }

  private async fetchSupabaseUser(token: string): Promise<TokenIdentity | null> {
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: this.supabaseServiceKey,
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Supabase validation failed with status ${String(response.status)}: ${response.statusText}`,
        );
        return null;
      }

      const payload = (await response.json()) as { id?: string; email?: string };
      return {
        id: payload.id ?? undefined,
        email: payload.email ?? undefined,
      };
    } catch (error) {
      this.logger.warn(`Supabase validation error: ${(error as Error).message}`);
      return null;
    }
  }

  private decodeJwtToken(token: string): TokenIdentity | null {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
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

  private async findUser(identity: TokenIdentity): Promise<User | null> {
    const filters: Prisma.UserWhereInput[] = [];

    if (identity.id) {
      filters.push({ id: identity.id });
    }
    if (identity.email) {
      filters.push({ email: identity.email });
    }

    if (filters.length === 0) {
      return null;
    }

    const where: Prisma.UserWhereInput =
      filters.length === 1 ? filters[0] : { OR: filters };

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

