import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Environment config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per user
      },
    ]),

    // Cron jobs (reservation expiry worker)
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature modules (will be added as we build them)
    // AuthModule,
    // UsersModule,
    // AddressesModule,
    // CategoriesModule,
    // ProductsModule,
    // MediaModule,
    // InventoryModule,
    // CartModule,
    // CheckoutModule,
    // OrdersModule,
    // PaymentsModule,
    // AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
