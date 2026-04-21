// src/app/models/product.model.ts
export interface ProductDto {
  productID: number;
  name: string;
  brandID: number;
  brandName: string;
  categoryID: string;
  categoryName: string;
  price: number;
  discount: number;
  description?: string;
  stockQuantity: number;
  createdAt: Date; // hoặc Date
  status: boolean;
}

export interface ProductCreateDto {
  name: string;
  BrandID: number;
  categoryID: string;
  price: number;
  discount?: number;
  description?: string;
  stockQuantity?: number;
  status?: boolean;
}

export interface ProductUpdateDto {
  name: string;
  BrandID: number;
  categoryID: string;
  price: number;
  discount?: number;
  description?: string;
  stockQuantity?: number;
  status?: boolean;
}
