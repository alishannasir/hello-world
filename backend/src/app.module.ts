import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MatchingModule } from './matching/matching.module';
import { FriendsModule } from './friends/friends.module';
import { PaymentsModule } from './payments/payments.module';
import { ModerationModule } from './moderation/moderation.module';
import { StreaksModule } from './streaks/streaks.module';
import { GeoMiddleware } from './common/geo/geo.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    MatchingModule,
    FriendsModule,
    PaymentsModule,
    ModerationModule,
    StreaksModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GeoMiddleware).forRoutes('*');
  }
}
