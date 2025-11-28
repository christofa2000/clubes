import { ClassType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min
} from 'class-validator';

export enum RecurrenceMode {
  SINGLE = 'SINGLE',
  RECURRING = 'RECURRING'
}

class SingleScheduleDto {
  @IsDateString()
  date!: string;

  @IsString()
  startTime!: string; // HH:mm

  @IsString()
  endTime!: string; // HH:mm
}

class RecurringScheduleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek!: number[];

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

export class CreateClassDto {
  @IsString()
  activityId!: string;

  @IsString()
  branchId!: string;

  @IsString()
  teacherId!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsEnum(ClassType)
  type!: ClassType;

  @IsOptional()
  @IsString()
  level?: string;

  @IsInt()
  @Min(1)
  maxStudents!: number;

  @IsOptional()
  @IsBoolean()
  reservationModeAdminOnly?: boolean;

  @IsEnum(RecurrenceMode)
  mode!: RecurrenceMode;

  @IsOptional()
  single?: SingleScheduleDto;

  @IsOptional()
  recurring?: RecurringScheduleDto;
}

