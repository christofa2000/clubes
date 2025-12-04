import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SupabaseAdminService } from './supabase-admin.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, SupabaseAdminService],
  exports: [AuthService, AuthGuard, RolesGuard, SupabaseAdminService],
})
export class AuthModule {}

