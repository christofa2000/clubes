import {
  Body,
  Controller,
  Get,
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
}





