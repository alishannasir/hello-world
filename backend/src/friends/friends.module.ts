import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { PresenceService } from './presence.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [PaymentsModule],
  controllers: [FriendsController, MessagesController],
  providers: [FriendsService, PresenceService, MessagesService],
  exports: [FriendsService, PresenceService, MessagesService],
})
export class FriendsModule {}
