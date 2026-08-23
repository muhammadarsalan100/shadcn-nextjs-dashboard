import {
  getProductRegionDiscounts,
  type GetProductRegionDiscountsResponse,
} from "@/app/services/product-region-discounts";
import { useQuery } from "@tanstack/react-query";

// Fetch every regional discount configured for a product (all regions, up to 100)
export function useProductRegionDiscounts(productId: number | null) {
  return useQuery<GetProductRegionDiscountsResponse>({
    queryKey: ["product-region-discounts", productId],
    queryFn: () => getProductRegionDiscounts(productId!, { limit: 100 }),
    enabled: !!productId,
  });
}
