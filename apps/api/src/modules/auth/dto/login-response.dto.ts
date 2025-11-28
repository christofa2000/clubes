import { UserRole } from '@prisma/client';

export class LoginResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    clubId: string | null;
  };
}

