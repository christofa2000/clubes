import { PlanType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  activityId!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsEnum(PlanType)
  type!: PlanType;

  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'price must be a valid decimal with up to two decimals' })
  price!: string;

  @IsOptional()
  @IsNumber()
  classesPerWeek?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}











