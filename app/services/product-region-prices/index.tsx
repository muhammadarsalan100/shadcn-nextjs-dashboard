import { apiClientJson } from "@/lib/api-client";

// A single region-scoped price attached to one product size
export type ProductRegionPrice = {
  id: number;
  price: string;
  active: boolean;
  productSize: {
    id: number;
    size: string;
    stock: number;
  };
  region: {
    id: number;
    name: string;
    currencyCode: string;
  };
};

export type CreateProductRegionPriceInput = {
  productSizeId: number;
  regionId: number;
  price: number;
  active?: boolean;
};

export type UpdateProductRegionPriceInput = {
  price?: number;
  active?: boolean;
};

export type ProductRegionPriceRecord = {
  id: number;
  productSizeId: number;
  regionId: number;
  price: string;
  active: boolean;
};

// Get every regional price configured across all sizes of a product
export async function getProductRegionPrices(productId: number): Promise<ProductRegionPrice[]> {
  const json = await apiClientJson<{ data: ProductRegionPrice[] }>(
    `/api/products/${productId}/region-prices`
  );
  return json.data;
}

// Create a regional price for one product size
export async function createProductRegionPrice(
  productId: number,
  data: CreateProductRegionPriceInput
): Promise<ProductRegionPriceRecord> {
  const json = await apiClientJson<{ data: { productRegionPrice: ProductRegionPriceRecord } }>(
    `/api/products/${productId}/region-prices`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return json.data.productRegionPrice;
}

// Update the price and/or active status of an existing regional price
export async function updateProductRegionPrice(
  id: number,
  data: UpdateProductRegionPriceInput
): Promise<ProductRegionPriceRecord> {
  const json = await apiClientJson<{ data: { productRegionPrice: ProductRegionPriceRecord } }>(
    `/api/product-region-prices/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return json.data.productRegionPrice;
}

// Permanently remove a regional price
export async function deleteProductRegionPrice(id: number): Promise<void> {
  await apiClientJson(`/api/product-region-prices/${id}`, {
    method: "DELETE",
  });
}
