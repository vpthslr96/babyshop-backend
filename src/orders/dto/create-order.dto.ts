import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type { DeliveryMethod, PaymentMethod } from '../entities/order.entity';

const DELIVERY_METHODS: DeliveryMethod[] = ['delivery', 'pickup'];
const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card'];

export class OrderItemDto {
  @IsUUID()
  productId: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsIn(DELIVERY_METHODS)
  deliveryMethod: DeliveryMethod;

  @ValidateIf((dto: CreateOrderDto) => dto.deliveryMethod === 'delivery')
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address?: string;

  @IsIn(PAYMENT_METHODS)
  paymentMethod: PaymentMethod;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
