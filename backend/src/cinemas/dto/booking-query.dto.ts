import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class BookingQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  groupSize: number;
}