import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  department?: string | null;

  @IsOptional()
  @IsInt()
  parentId?: number | null;
}