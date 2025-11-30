import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateAdminDto {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsString()
  clubId!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}





