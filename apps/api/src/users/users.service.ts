import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import type { CurrentUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UserFiltersDto } from './dto/user-filters.dto';

@Injectable()
export class UsersService {
  private static readonly TEMP_PASSWORD = 'temporary';

  constructor(private readonly prisma: PrismaService) {}

  async getMe(currentUser: CurrentUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clubId: true,
        club: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return user;
  }

  async createAdmin(dto: CreateAdminDto) {
    await this.ensureClubExists(dto.clubId);
    await this.ensureEmailAvailable(dto.email);

    return this.createUser({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      phone: dto.phone ?? null,
      role: UserRole.ADMIN,
      clubId: dto.clubId,
    });
  }

  listAdmins(filters: UserFiltersDto = {}) {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        clubId: filters.clubId ?? undefined,
      },
      select: this.defaultSelect(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStudent(currentUser: CurrentUser, dto: CreateStudentDto) {
    const clubId = this.ensureUserClub(currentUser);
    await this.ensureEmailAvailable(dto.email);
    await this.ensureBranchBelongsToClub(dto.branchId, clubId);

    return this.createUser({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      phone: dto.phone ?? null,
      role: UserRole.STUDENT,
      clubId,
    });
  }

  async createTeacher(currentUser: CurrentUser, dto: CreateTeacherDto) {
    const clubId = this.ensureUserClub(currentUser);
    await this.ensureEmailAvailable(dto.email);
    await this.ensureBranchBelongsToClub(dto.branchId, clubId);

    return this.createUser({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      phone: dto.phone ?? null,
      role: UserRole.TEACHER,
      clubId,
    });
  }

  listStudents(currentUser: CurrentUser) {
    const clubId = this.ensureUserClub(currentUser);
    return this.listByRoleAndClub(UserRole.STUDENT, clubId);
  }

  listTeachers(currentUser: CurrentUser) {
    const clubId = this.ensureUserClub(currentUser);
    return this.listByRoleAndClub(UserRole.TEACHER, clubId);
  }

  private async createUser(data: {
    email: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    role: UserRole;
    clubId: string | null;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: UsersService.TEMP_PASSWORD,
        firstName: data.firstName,
        lastName: data.lastName ?? '',
        phone: data.phone,
        role: data.role,
        clubId: data.clubId,
      },
      select: this.defaultSelect(),
    });
  }

  private listByRoleAndClub(role: UserRole, clubId: string) {
    return this.prisma.user.findMany({
      where: { role, clubId },
      select: this.defaultSelect(),
      orderBy: { createdAt: 'desc' },
    });
  }

  private defaultSelect() {
    return {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      clubId: true,
      phone: true,
    };
  }

  private ensureUserClub(user: CurrentUser): string {
    if (!user.clubId) {
      throw new BadRequestException('USER_CLUB_REQUIRED');
    }
    return user.clubId;
  }

  private async ensureClubExists(clubId: string) {
    const exists = await this.prisma.club.count({ where: { id: clubId } });
    if (!exists) {
      throw new NotFoundException('CLUB_NOT_FOUND');
    }
  }

  private async ensureEmailAvailable(email: string) {
    const exists = await this.prisma.user.count({ where: { email } });
    if (exists) {
      throw new ConflictException('EMAIL_ALREADY_IN_USE');
    }
  }

  private async ensureBranchBelongsToClub(branchId: string | undefined, clubId: string) {
    if (!branchId) {
      return;
    }
    const exists = await this.prisma.branch.count({ where: { id: branchId, clubId } });
    if (!exists) {
      throw new ForbiddenException('FORBIDDEN_OTHER_CLUB');
    }
  }
}
