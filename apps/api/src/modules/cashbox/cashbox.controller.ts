import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CashboxService } from './cashbox.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('cashbox')
export class CashboxController {
  constructor(private readonly cashboxService: CashboxService) {}

  @Get()
  list() {
    return this.cashboxService.listPlaceholder();
  }
}

