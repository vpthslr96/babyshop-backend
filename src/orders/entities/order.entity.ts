import { randomUUID } from 'crypto';
import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'card';

@Entity('orders')
export class Order {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    this.id ??= randomUUID();
  }

  @Column()
  customerName: string;

  @Column()
  phone: string;

  @Column({ type: 'varchar' })
  deliveryMethod: DeliveryMethod;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar' })
  paymentMethod: PaymentMethod;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: false })
  isCancelled: boolean;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
