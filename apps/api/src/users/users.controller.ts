import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser as CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '../common/interfaces/auth-user.interface';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUserDecorator() user: CurrentUser) {
    return this.usersService.getMe(user);
  }

  @Post('admin')
  @Roles(UserRole.SUPER_ADMIN)
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto);
  }

  @Get('admins')
  @Roles(UserRole.SUPER_ADMIN)
  listAdmins(@Query() filters: UserFiltersDto) {
    return this.usersService.listAdmins(filters);
  }

  @Post('students')
  @Roles(UserRole.ADMIN)
  createStudent(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateStudentDto,
  ) {
    return this.usersService.createStudent(user, dto);
  }

  @Post('teachers')
  @Roles(UserRole.ADMIN)
  createTeacher(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateTeacherDto,
  ) {
    return this.usersService.createTeacher(user, dto);
  }

  @Get('students')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  listStudents(@CurrentUserDecorator() user: CurrentUser) {
    return this.usersService.listStudents(user);
  }

  @Get('teachers')
  @Roles(UserRole.ADMIN)
  listTeachers(@CurrentUserDecorator() user: CurrentUser) {
    return this.usersService.listTeachers(user);
  }

  @Delete('admins/:id')
  @Roles(UserRole.SUPER_ADMIN)
  deleteAdmin(
    @Param('id') id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.usersService.deleteAdmin(id, user);
  }

  /**
   * Invita a un usuario al sistema enviando un email de invitación.
   * 
   * Solo SUPER_ADMIN puede invitar usuarios.
   * El sistema enviará un email con un magic link que redirige a /auth/set-password.
   * El usuario debe establecer su contraseña antes de poder hacer login.
   * 
   * @param dto - Datos del usuario a invitar (email, role, firstName, clubId, etc.)
   * @returns Usuario creado en Prisma con estado inicial (active=false hasta que establezca contraseña)
   */
  @Post('invite')
  @Roles(UserRole.SUPER_ADMIN)
  inviteUser(@Body() dto: InviteUserDto) {
    return this.usersService.inviteUser(dto);
  }

  /**
   * Elimina un usuario del sistema.
   * 
   * Realiza eliminación REAL en Supabase Auth y soft delete en Prisma.
   * Solo SUPER_ADMIN puede eliminar usuarios.
   * 
   * @param id - ID del usuario a eliminar (ID interno de Prisma)
   * @param user - Usuario actual que ejecuta la acción
   * @returns Usuario actualizado con soft delete
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  deleteUser(@Param('id') id: string, @CurrentUserDecorator() user: CurrentUser) {
    return this.usersService.deleteUser(id, user);
  }
}








