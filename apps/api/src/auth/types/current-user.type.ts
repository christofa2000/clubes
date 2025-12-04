import { UserRole } from '@prisma/client';

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  clubId: string | null;
  branchId?: string | null;
};

export type TokenIdentity = {
  id?: string;
  email?: string;
};










