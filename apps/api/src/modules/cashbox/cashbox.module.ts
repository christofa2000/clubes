import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { CashboxController } from './cashbox.controller';
import { CashboxService } from './cashbox.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CashboxController],
  providers: [CashboxService]
})
export class CashboxModule {}



