import { IsBoolean } from 'class-validator';

export class UpdateOrderDto {
  @IsBoolean()
  isCompleted: boolean;
}
