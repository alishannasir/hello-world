import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { StreaksController } from './streaks.controller';
import { StreaksService } from './streaks.service';

@Module({
  imports: [PaymentsModule],
  controllers: [StreaksController],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
