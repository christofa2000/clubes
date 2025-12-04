import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(3, 255)
  address!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}












