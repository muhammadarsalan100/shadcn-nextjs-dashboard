import { apiClientJson } from "@/lib/api-client";

// A discount configured for one product in one region
export type ProductRegionDiscount = {
  id: number;
  discountPercentage: string;
  startDateTime: string;
  endDateTime: string | null;
  active: boolean;
  region: {
    id: number;
    name: string;
  };
};

export type GetProductRegionDiscountsParams = {
  regionId?: number;
  active?: boolean;
  page?: number;
  limit?: number;
};

export type GetProductRegionDiscountsResponse = {
  results: number;
  totalResults: number;
  totalPages: number;
  page: number;
  limit: number;
  data: ProductRegionDiscount[];
};

export type CreateProductRegionDiscountInput = {
  regionId: number;
  discountPercentage: number;
  startDateTime: string; // ISO datetime, must include Z or an explicit offset
  endDateTime?: string | null;
  active?: boolean;
};

export type UpdateProductRegionDiscountInput = {
  discountPercentage?: number;
  startDateTime?: string;
  endDateTime?: string | null;
  active?: boolean;
};

export type ProductRegionDiscountRecord = {
  id: number;
  productId?: number;
  discountPercentage: string;
  startDateTime: string;
  endDateTime: string | null;
  active: boolean;
  region?: {
    id: number;
    name: string;
  };
};

// Get the regional discounts configured for a product (optionally filtered/paginated)
export async function getProductRegionDiscounts(
  productId: number,
  params: GetProductRegionDiscountsParams = {}
): Promise<GetProductRegionDiscountsResponse> {
  const query = new URLSearchParams();
  if (params.regionId != null) query.set("regionId", String(params.regionId));
  if (params.active != null) query.set("active", String(params.active));
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();

  return apiClientJson<GetProductRegionDiscountsResponse>(
    `/api/products/${productId}/region-discounts${qs ? `?${qs}` : ""}`
  );
}

// Create a regional discount for a product
export async function createProductRegionDiscount(
  productId: number,
  data: CreateProductRegionDiscountInput
): Promise<ProductRegionDiscountRecord> {
  const json = await apiClientJson<{ data: { discount: ProductRegionDiscountRecord } }>(
    `/api/products/${productId}/region-discounts`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return json.data.discount;
}

// Update a regional discount's percentage, schedule, and/or active status
export async function updateProductRegionDiscount(
  id: number,
  data: UpdateProductRegionDiscountInput
): Promise<ProductRegionDiscountRecord> {
  const json = await apiClientJson<{ data: { discount: ProductRegionDiscountRecord } }>(
    `/api/product-region-discounts/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return json.data.discount;
}

// Permanently remove a regional discount
export async function deleteProductRegionDiscount(id: number): Promise<void> {
  await apiClientJson(`/api/product-region-discounts/${id}`, {
    method: "DELETE",
  });
}
