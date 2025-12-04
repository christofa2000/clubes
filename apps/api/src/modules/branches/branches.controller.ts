import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user.clubId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.branchesService.findAll(user.clubId);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(user.clubId, id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.branchesService.deactivate(user.clubId, id);
  }
}











