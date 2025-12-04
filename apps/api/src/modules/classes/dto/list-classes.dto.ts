import { IsOptional, IsString } from 'class-validator';

export class ListClassesDto {
  @IsOptional()
  @IsString()
  activityId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;
}












