import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import type { CurrentUser } from '../common/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAdminService } from '../auth/supabase-admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';

@Injectable()
export class UsersService {
  private static readonly TEMP_PASSWORD = 'temporary';
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAdminService: SupabaseAdminService,
  ) {}

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
    const clubId = dto.clubId;
    const normalizedEmail = dto.email.trim().toLowerCase();

    await this.ensureClubExists(clubId);
    await this.ensureEmailAvailable(normalizedEmail);

    const supabaseUser = await this.supabaseAdminService.inviteUserByEmail(normalizedEmail);

    try {
      return await this.createUser({
        email: normalizedEmail,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        phone: dto.phone ?? null,
        role: UserRole.ADMIN,
        clubId,
        supabaseUserId: supabaseUser.id,
      });
    } catch (error) {
      this.logger.error(
        `[UsersService] Failed to persist admin in Prisma after Supabase invite (${normalizedEmail}): ${
          (error as Error).message
        }`,
      );
      await this.supabaseAdminService.deleteUser(supabaseUser.id);
      throw new InternalServerErrorException('ADMIN_CREATION_FAILED');
    }
  }

  listAdmins(filters: UserFiltersDto = {}) {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        clubId: filters.clubId ?? undefined,
        active: true,
        deletedAt: null,
      },
      select: this.defaultSelect(),
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Elimina un usuario del sistema.
   * 
   * Realiza eliminación REAL en Supabase Auth y soft delete en Prisma.
   * 
   * Flujo:
   * 1. Busca el usuario en Prisma por ID
   * 2. Obtiene su supabaseUserId
   * 3. Elimina el usuario en Supabase Auth usando SERVICE_ROLE_KEY
   * 4. Hace soft delete en Prisma (active=false, deletedAt=now)
   * 
   * Solo SUPER_ADMIN puede eliminar usuarios.
   * No se puede eliminar a uno mismo.
   * 
   * @param userId - ID del usuario a eliminar (ID interno de Prisma)
   * @param currentUser - Usuario actual que ejecuta la acción
   * @returns Usuario actualizado con soft delete
   */
  async deleteUser(userId: string, currentUser: CurrentUser) {
    // No permitir que un usuario se elimine a sí mismo
    if (currentUser.id === userId) {
      throw new BadRequestException('CANNOT_DELETE_SELF');
    }

    // Buscar usuario en Prisma
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    // Verificar que no esté ya eliminado
    if (!user.active || user.deletedAt) {
      throw new BadRequestException('USER_ALREADY_DELETED');
    }

    // Si tiene supabaseUserId, eliminar en Supabase Auth primero
    // Esto previene que el usuario pueda seguir haciendo login
    if (user.supabaseUserId) {
      try {
        await this.supabaseAdminService.deleteUser(user.supabaseUserId);
        this.logger.log(`[UsersService] Deleted user ${userId} from Supabase Auth (${user.supabaseUserId})`);
      } catch (error) {
        // Si falla la eliminación en Supabase, loguear pero continuar con soft delete en Prisma
        // Esto evita que un error en Supabase bloquee la eliminación en nuestra DB
        this.logger.warn(
          `[UsersService] Failed to delete user ${userId} from Supabase Auth: ${(error as Error).message}`,
        );
      }
    }

    // Hacer soft delete en Prisma
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        active: false,
        deletedAt: new Date(),
      },
      select: this.defaultSelect(),
    });
  }

  async deleteAdmin(adminId: string, currentUser: CurrentUser) {
    // No permitir que un admin se elimine a sí mismo
    if (currentUser.id === adminId) {
      throw new BadRequestException('CANNOT_DELETE_SELF');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('ADMIN_NOT_FOUND');
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new BadRequestException('USER_IS_NOT_ADMIN');
    }

    if (!admin.active || admin.deletedAt) {
      throw new BadRequestException('ADMIN_ALREADY_DELETED');
    }

    // Usar el método deleteUser que hace delete real en Supabase + soft delete en Prisma
    return this.deleteUser(adminId, currentUser);
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

  /**
   * Invita a un usuario al sistema enviando un email de invitación.
   * 
   * Flujo completo:
   * 1. SUPER_ADMIN invita usuario con email y rol
   * 2. Se envía invitación vía Supabase Auth (magic link)
   * 3. Usuario recibe email y hace clic en el link
   * 4. Usuario es redirigido a /auth/set-password para establecer su contraseña
   * 5. Usuario establece contraseña y puede hacer login normalmente
   * 
   * Solo SUPER_ADMIN puede invitar usuarios de cualquier rol.
   * Para otros roles (ADMIN, TEACHER, STUDENT), se requiere clubId.
   * 
   * @param dto - Datos del usuario a invitar (email, role, firstName, etc.)
   * @returns Usuario creado en Prisma con estado inicial
   */
  async inviteUser(dto: InviteUserDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const role = dto.role;

    // Validar que el email no esté ya en uso
    await this.ensureEmailAvailable(normalizedEmail);

    // Validar clubId según el rol
    // SUPER_ADMIN no tiene clubId, otros roles sí lo requieren
    if (role === UserRole.SUPER_ADMIN) {
      if (dto.clubId) {
        throw new BadRequestException('SUPER_ADMIN_CANNOT_HAVE_CLUB');
      }
    } else {
      if (!dto.clubId) {
        throw new BadRequestException('CLUB_ID_REQUIRED_FOR_ROLE');
      }
      await this.ensureClubExists(dto.clubId);
    }

    // Invitar usuario en Supabase Auth con metadatos
    // Esto enviará un email con magic link que redirige a /auth/set-password
    const supabaseUser = await this.supabaseAdminService.inviteUserByEmail(normalizedEmail, {
      role,
      clubId: dto.clubId,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    try {
      // Crear usuario en Prisma con estado inicial
      // Usuario invitado: active=false inicialmente (se activará cuando establezca contraseña)
      // No guardamos password aquí porque el usuario la establecerá en /auth/set-password
      return await this.createUser({
        email: normalizedEmail,
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        phone: dto.phone ?? null,
        role,
        clubId: dto.clubId ?? null,
        supabaseUserId: supabaseUser.id,
        active: false, // Usuario invitado, se activará cuando establezca contraseña
      });
    } catch (error) {
      this.logger.error(
        `[UsersService] Failed to persist user in Prisma after Supabase invite (${normalizedEmail}): ${
          (error as Error).message
        }`,
      );
      // Si falla la creación en Prisma, intentar limpiar el usuario de Supabase
      await this.supabaseAdminService.deleteUser(supabaseUser.id);
      throw new InternalServerErrorException('USER_INVITATION_FAILED');
    }
  }

  private async createUser(data: {
    email: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    role: UserRole;
    clubId: string | null;
    supabaseUserId?: string | null;
    active?: boolean;
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
        supabaseUserId: data.supabaseUserId ?? null,
        active: data.active ?? true, // Por defecto activo, false si es invitado
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
      supabaseUserId: true,
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
