import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateClubDto {
  @IsString()
  @Length(3, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  secondaryColor?: string;
}

