import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  clubId: string | null;
  iat?: number;
  exp?: number;
}












