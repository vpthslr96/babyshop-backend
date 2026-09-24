import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

function getPrimaryImageUrl(product: Product): string | null {
  const primary = product.images?.find((img) => img.isPrimary);
  return primary?.url ?? product.images?.[0]?.url ?? null;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const productIds = dto.items.map((item) => item.productId);
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
        relations: ['images'],
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('Некоторые товары не найдены');
      }

      const unavailable = products.find((p) => !p.isAvailable);
      if (unavailable) {
        throw new ConflictException(`Товар «${unavailable.name}» уже недоступен`);
      }

      const order = manager.create(Order, {
        customerName: dto.customerName,
        phone: dto.phone,
        deliveryMethod: dto.deliveryMethod,
        address: dto.deliveryMethod === 'delivery' ? dto.address : null,
        paymentMethod: dto.paymentMethod,
        items: products.map((product) =>
          manager.create(OrderItem, {
            productId: product.id,
            productName: product.name,
            price: product.price,
            imageUrl: getPrimaryImageUrl(product),
            size: product.size,
          }),
        ),
      });

      const saved = await manager.save(order);
      await manager.update(Product, productIds, { isAvailable: false });

      return saved;
    });
  }

  findAll(): Promise<Order[]> {
    return this.orders.find({ relations: ['items'], order: { createdAt: 'DESC' } });
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.orders.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException('Заказ не найден');

    order.isCompleted = dto.isCompleted;
    return this.orders.save(order);
  }

  async cancel(id: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id }, relations: ['items'] });
      if (!order) throw new NotFoundException('Заказ не найден');
      if (order.isCancelled) throw new ConflictException('Заказ уже отменён');

      const productIds = order.items.map((item) => item.productId).filter((id): id is string => id !== null);
      if (productIds.length > 0) {
        await manager.update(Product, productIds, { isAvailable: true });
      }

      order.isCancelled = true;
      return manager.save(order);
    });
  }
}
