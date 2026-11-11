import { apiClientJson } from "@/lib/api-client";

// A single region-scoped price attached to one product size
export type ProductRegionPrice = {
  id: number;
  price: number;
  priceCurrency: string;
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
  price: number;
  priceCurrency: string;
  active: boolean;
};

type ProductRegionPriceResponse = Omit<ProductRegionPrice, "price"> & {
  price: string | number;
};

type ProductRegionPriceRecordResponse = Omit<ProductRegionPriceRecord, "price"> & {
  price: string | number;
};

function parsePrice(price: string | number): number {
  const parsed = Number(price);
  if (!Number.isFinite(parsed)) {
    throw new Error("The server returned an invalid regional price.");
  }
  return parsed;
}

function parsePriceRecord(price: ProductRegionPriceRecordResponse): ProductRegionPriceRecord {
  return { ...price, price: parsePrice(price.price) };
}

// Get every active and inactive regional price configured across a product's sizes.
export async function getProductRegionPrices(productId: number): Promise<ProductRegionPrice[]> {
  const json = await apiClientJson<{ results: number; data: ProductRegionPriceResponse[] }>(
    `/api/products/${productId}/region-prices`
  );
  return json.data.map((price) => ({ ...price, price: parsePrice(price.price) }));
}

// Create a regional price for one product size
export async function createProductRegionPrice(
  productId: number,
  data: CreateProductRegionPriceInput
): Promise<ProductRegionPriceRecord> {
  const json = await apiClientJson<{
    data: { productRegionPrice: ProductRegionPriceRecordResponse };
  }>(
    `/api/products/${productId}/region-prices`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return parsePriceRecord(json.data.productRegionPrice);
}

// Update the price and/or active status of an existing regional price
export async function updateProductRegionPrice(
  id: number,
  data: UpdateProductRegionPriceInput
): Promise<ProductRegionPriceRecord> {
  const json = await apiClientJson<{
    data: { productRegionPrice: ProductRegionPriceRecordResponse };
  }>(
    `/api/product-region-prices/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return parsePriceRecord(json.data.productRegionPrice);
}

// Permanently remove a regional price
export async function deleteProductRegionPrice(id: number): Promise<void> {
  await apiClientJson(`/api/product-region-prices/${id}`, {
    method: "DELETE",
  });
}
