import {
  getProductRegionPromotions,
  type GetProductRegionPromotionsResponse,
} from "@/app/services/product-region-promotions";
import { useQuery } from "@tanstack/react-query";

// Fetch every regional promotion configured for a product
export function useProductRegionPromotions(productId: number | null) {
  return useQuery<GetProductRegionPromotionsResponse>({
    queryKey: ["product-region-promotions", productId],
    queryFn: () => getProductRegionPromotions(productId!),
    enabled: !!productId,
  });
}
