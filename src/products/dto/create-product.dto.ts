import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import type { ClothingCondition, ClothingType, Gender, Season } from '../entities/product.entity';

const CLOTHING_TYPES: ClothingType[] = ['bodysuit', 'winter_suit', 'sweatshirt', 'tshirt', 'shorts', 'pants'];
const CONDITIONS: ClothingCondition[] = ['new', 'like_new', 'used'];
const GENDERS: Gender[] = ['boy', 'girl', 'unisex'];
const SEASONS: Season[] = ['summer', 'winter', 'demi', 'all'];

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  originalPrice?: number;

  @IsIn(CLOTHING_TYPES)
  type: ClothingType;

  @IsIn(CONDITIONS)
  condition: ClothingCondition;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: Gender;

  @IsOptional()
  @IsIn(SEASONS)
  season?: Season;

  @IsInt()
  @Min(50)
  size: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ageRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
