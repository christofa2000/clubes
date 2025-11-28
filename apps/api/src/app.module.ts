import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './health/health.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CashboxModule } from './modules/cashbox/cashbox.module';
import { ClassesModule } from './modules/classes/classes.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlansModule } from './modules/plans/plans.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ClubsModule,
    BranchesModule,
    ActivitiesModule,
    PlansModule,
    ClassesModule,
    ReservationsModule,
    AttendanceModule,
    PaymentsModule,
    CashboxModule,
    ReportsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
