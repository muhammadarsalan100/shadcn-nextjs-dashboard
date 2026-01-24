import { apiClientJson } from "@/lib/api-client";

// Types
export type ProductSize = {
  id: number;
  productId: number;
  size: string;
  stock: number;
  price: string;
};

// Get product sizes by product ID
export async function getProductSizes(productId: number): Promise<ProductSize[]> {
  const json = await apiClientJson<{ data?: ProductSize[] }>(`/api/product-sizes?productId=${productId}`);
  return json.data || [];
}

export type CreateProductSizeInput = {
  productId: number;
  size: string;
  stock: number;
  price: number;
};

export type UpdateProductSizeInput = {
  size?: string;
  stock?: number;
  price?: number;
};

// Create product size
export async function createProductSize(data: CreateProductSizeInput): Promise<ProductSize> {
  const json = await apiClientJson<{ data: { productSize: ProductSize } }>("/api/product-sizes", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data.productSize;
}

// Update product size
export async function updateProductSize(id: number, data: UpdateProductSizeInput): Promise<ProductSize> {
  const json = await apiClientJson<{ data: { productSize: ProductSize } }>(`/api/product-sizes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data.productSize;
}

// Delete product size
export async function deleteProductSize(id: number): Promise<void> {
  await apiClientJson(`/api/product-sizes/${id}`, {
    method: "DELETE",
  });
}
