import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

/**
 * DTO para invitar usuarios al sistema.
 * 
 * Solo el SUPER_ADMIN puede invitar usuarios.
 * El sistema enviará un email de invitación usando Supabase Auth.
 * El usuario recibirá un magic link que lo llevará a /auth/set-password para definir su contraseña.
 */
export class InviteUserDto {
  @IsEmail({}, { message: 'EMAIL_INVALID' })
  email!: string;

  @IsEnum(UserRole, { message: 'ROLE_INVALID' })
  role!: UserRole;

  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * ID del club al que pertenece el usuario.
   * Requerido para todos los roles excepto SUPER_ADMIN.
   * Para SUPER_ADMIN debe ser null o undefined.
   */
  @IsOptional()
  @IsString()
  clubId?: string;
}



