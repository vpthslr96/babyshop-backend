import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import type { ClothingCondition, ClothingType, Gender, Season } from '../entities/product.entity';

const CLOTHING_TYPES: ClothingType[] = ['bodysuit', 'winter_suit', 'sweatshirt', 'tshirt', 'shorts', 'pants'];
const CONDITIONS: ClothingCondition[] = ['new', 'like_new', 'used'];
const GENDERS: Gender[] = ['boy', 'girl', 'unisex'];
const SEASONS: Season[] = ['summer', 'winter', 'demi', 'all'];
const SORTS = ['newest', 'price_asc', 'price_desc'] as const;
export type ProductSort = (typeof SORTS)[number];

export class QueryProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(CLOTHING_TYPES)
  type?: ClothingType;

  @IsOptional()
  @IsIn(CONDITIONS)
  condition?: ClothingCondition;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: Gender;

  @IsOptional()
  @IsIn(SEASONS)
  season?: Season;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  size?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsIn(SORTS)
  sort?: ProductSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
