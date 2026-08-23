import { apiClientJson } from "@/lib/api-client";

// A promotion (free shipping / welcome offer) configured for one product in one region
export type ProductRegionPromotion = {
  id: number;
  freeShipping: boolean;
  welcomeDiscountPercentage: string;
  welcomeOfferActive: boolean;
  welcomeOfferStartAt: string | null;
  welcomeOfferEndAt: string | null;
  region: {
    id: number;
    name: string;
  };
};

export type GetProductRegionPromotionsResponse = {
  results: number;
  data: ProductRegionPromotion[];
};

export type CreateProductRegionPromotionInput = {
  regionId: number;
  freeShipping?: boolean;
  welcomeDiscountPercentage?: number;
  welcomeOfferActive?: boolean;
  welcomeOfferStartAt?: string | null; // ISO datetime, must include Z or an explicit offset
  welcomeOfferEndAt?: string | null;
};

export type UpdateProductRegionPromotionInput = {
  freeShipping?: boolean;
  welcomeDiscountPercentage?: number;
  welcomeOfferActive?: boolean;
  welcomeOfferStartAt?: string | null;
  welcomeOfferEndAt?: string | null;
};

export type ProductRegionPromotionRecord = {
  id: number;
  productId?: number;
  regionId?: number;
  freeShipping: boolean;
  welcomeDiscountPercentage: string;
  welcomeOfferActive: boolean;
  welcomeOfferStartAt: string | null;
  welcomeOfferEndAt: string | null;
  region?: {
    id: number;
    name: string;
  };
};

// Get every regional promotion configured for a product
export async function getProductRegionPromotions(
  productId: number
): Promise<GetProductRegionPromotionsResponse> {
  return apiClientJson<GetProductRegionPromotionsResponse>(
    `/api/products/${productId}/region-promotions`
  );
}

// Create a regional promotion (free shipping and/or welcome offer) for a product
export async function createProductRegionPromotion(
  productId: number,
  data: CreateProductRegionPromotionInput
): Promise<ProductRegionPromotionRecord> {
  const json = await apiClientJson<{ data: { productRegionPromotion: ProductRegionPromotionRecord } }>(
    `/api/products/${productId}/region-promotions`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return json.data.productRegionPromotion;
}

// Update an existing regional promotion
export async function updateProductRegionPromotion(
  id: number,
  data: UpdateProductRegionPromotionInput
): Promise<ProductRegionPromotionRecord> {
  const json = await apiClientJson<{ data: { productRegionPromotion: ProductRegionPromotionRecord } }>(
    `/api/product-region-promotions/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return json.data.productRegionPromotion;
}

// Permanently remove a regional promotion
export async function deleteProductRegionPromotion(id: number): Promise<void> {
  await apiClientJson(`/api/product-region-promotions/${id}`, {
    method: "DELETE",
  });
}
