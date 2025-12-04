import { IsOptional, IsString } from 'class-validator';

export class UserFiltersDto {
  @IsOptional()
  @IsString()
  clubId?: string;
}










