import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ListClassesDto } from './dto/list-classes.dto';
import { ListOccurrencesDto } from './dto/list-occurrences.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateClassDto) {
    return this.classesService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() filters: ListClassesDto) {
    return this.classesService.list(user, filters);
  }

  @Get('occurrences')
  listOccurrences(@CurrentUser() user: AuthUser, @Query() filters: ListOccurrencesDto) {
    return this.classesService.listOccurrences(user, filters);
  }

  @Get(':id')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.classesService.getById(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(user, id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.classesService.deactivate(user, id);
  }
}

