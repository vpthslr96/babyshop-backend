import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { decimalTransformer } from '../../common/decimal.transformer';

export type ClothingType = 'bodysuit' | 'winter_suit' | 'sweatshirt' | 'tshirt' | 'shorts' | 'pants';
export type ClothingCondition = 'new' | 'like_new' | 'used';
export type Gender = 'boy' | 'girl' | 'unisex';
export type Season = 'summer' | 'winter' | 'demi' | 'all';

@Entity('products')
export class Product {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    this.id ??= randomUUID();
  }

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: decimalTransformer })
  price: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: decimalTransformer })
  originalPrice: number | null;

  @Column({ type: 'varchar' })
  type: ClothingType;

  @Column({ type: 'varchar' })
  condition: ClothingCondition;

  @Column({ type: 'varchar', default: 'unisex' })
  gender: Gender;

  @Column({ type: 'varchar', default: 'all' })
  season: Season;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'varchar', nullable: true })
  ageRange: string | null;

  @Column({ type: 'varchar', nullable: true })
  brand: string | null;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'int', default: 0 })
  views: number;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
