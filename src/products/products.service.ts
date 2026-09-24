import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { basename, join } from 'path';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(ProductImage) private readonly images: Repository<ProductImage>,
  ) {}

  async findAll(query: QueryProductDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.sort === 'price_asc') {
      qb.orderBy('product.price', 'ASC');
    } else if (query.sort === 'price_desc') {
      qb.orderBy('product.price', 'DESC');
    } else {
      qb.orderBy('product.createdAt', 'DESC');
    }

    if (query.search) {
      qb.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.type) qb.andWhere('product.type = :type', { type: query.type });
    if (query.condition) qb.andWhere('product.condition = :condition', { condition: query.condition });
    if (query.gender) qb.andWhere('product.gender = :gender', { gender: query.gender });
    if (query.season) qb.andWhere('product.season = :season', { season: query.season });
    if (query.size) qb.andWhere('product.size = :size', { size: query.size });
    if (query.minPrice) qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    if (query.maxPrice) qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    if (query.isAvailable !== undefined) {
      qb.andWhere('product.isAvailable = :isAvailable', { isAvailable: query.isAvailable });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.products.findOne({ where: { id }, relations: ['images'] });
    if (!product) throw new NotFoundException('Товар не найден');

    product.views += 1;
    await this.products.update(id, { views: product.views });

    return product;
  }

  create(dto: CreateProductDto): Promise<Product> {
    const product = this.products.create(dto);
    return this.products.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.products.preload({ id, ...dto });
    if (!product) throw new NotFoundException('Товар не найден');
    return this.products.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.products.delete(id);
    if (!result.affected) throw new NotFoundException('Товар не найден');
  }

  async addImage(productId: string, url: string): Promise<ProductImage> {
    const existingCount = await this.images.count({ where: { productId } });
    const image = this.images.create({ productId, url, isPrimary: existingCount === 0 });
    return this.images.save(image);
  }

  async removeImage(productId: string, imageId: string): Promise<void> {
    const image = await this.images.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Фото не найдено');

    await this.images.delete(imageId);
    await unlink(join(process.cwd(), 'uploads', basename(image.url))).catch(() => undefined);

    if (image.isPrimary) {
      const next = await this.images.findOne({ where: { productId }, order: { sortOrder: 'ASC' } });
      if (next) await this.images.update(next.id, { isPrimary: true });
    }
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    const image = await this.images.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Фото не найдено');

    await this.images.update({ productId }, { isPrimary: false });
    await this.images.update(imageId, { isPrimary: true });
  }
}
