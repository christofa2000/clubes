import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubsService } from './clubs.service';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser as CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '../common/interfaces/auth-user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.clubsService.findAll();
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateClubDto) {
    return this.clubsService.create(dto);
  }

  @Get('my')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  getMyClub(
    @CurrentUserDecorator() user: CurrentUser,
    @Query('clubId') clubId?: string,
  ) {
    return this.clubsService.getClubForUser(user, clubId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.clubsService.findById(id);
  }

  @Patch('my')
  @Roles(UserRole.ADMIN)
  updateMyClub(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: UpdateClubDto,
  ) {
    return this.clubsService.updateMyClub(user, dto);
  }
}

