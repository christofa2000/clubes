import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  role: UserRole;
  clubId: string | null;
  email: string;
}

