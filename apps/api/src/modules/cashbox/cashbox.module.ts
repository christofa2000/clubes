import { Module } from '@nestjs/common';

import { CashboxController } from './cashbox.controller';
import { CashboxService } from './cashbox.service';

@Module({
  controllers: [CashboxController],
  providers: [CashboxService]
})
export class CashboxModule {}

