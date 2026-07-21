import { apiClientJson } from "@/lib/api-client";

// Product discount types
export type ProductDiscount = {
  id: number;
  productId: number;
  regionId: number;
  discountPercentage: number;
  startDateTime: string;
  endDateTime: string | null;
  active: boolean;
};

export type CreateProductDiscountInput = {
  productId: number;
  regionId: number;
  discountPercentage: number;
  startDateTime: string;
  endDateTime?: string | null;
  active?: boolean;
};

export type UpdateProductDiscountInput = {
  regionId?: number;
  discountPercentage?: number;
  startDateTime?: string;
  endDateTime?: string | null;
  active?: boolean;
};

// Get discounts for a specific product
export async function getProductDiscountsByProduct(
  productId: number
): Promise<ProductDiscount[]> {
  const json = await apiClientJson<{ data: ProductDiscount[] }>(
    `/api/product-discounts/product/${productId}`
  );
  return json.data;
}

// Create product discount
export async function createProductDiscount(
  data: CreateProductDiscountInput
): Promise<ProductDiscount> {
  const json = await apiClientJson<{ data: ProductDiscount }>("/api/product-discounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}

// Update product discount
export async function updateProductDiscount(
  id: number,
  data: UpdateProductDiscountInput
): Promise<ProductDiscount> {
  const json = await apiClientJson<{ data: ProductDiscount }>(`/api/product-discounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data;
}

// Delete product discount
export async function deleteProductDiscount(id: number): Promise<{ message: string }> {
  return apiClientJson<{ message: string }>(`/api/product-discounts/${id}`, {
    method: "DELETE",
  });
}
