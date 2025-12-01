export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export type ApiCurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  clubId: string | null;
  branchId?: string | null;
};

export type ApiUserProfile = ApiCurrentUser & {
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  club?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
};

export type ApiClub = {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiBranch = {
  id: string;
  clubId: string;
  name: string;
  address: string;
  contactInfo?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiUserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  role: UserRole;
  clubId: string | null;
  branchId?: string | null;
  phone?: string | null;
};

export type DeleteClubResponse = {
  success: boolean;
  message: string;
};

export type DeleteAdminResponse = {
  success: boolean;
  message: string;
};

export type InviteUserRequest = {
  email: string;
  role: UserRole;
  firstName: string;
  lastName?: string;
  phone?: string;
  clubId?: string;
};

export type InviteUserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: UserRole;
  clubId: string | null;
  phone: string | null;
  supabaseUserId: string | null;
};

export type CreateClubRequest = {
  name: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export type CreateClubResponse = ApiClub;

export type DeleteUserResponse = {
  success: boolean;
  message: string;
};


