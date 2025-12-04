import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlansController],
  providers: [PlansService]
})
export class PlansModule {}



