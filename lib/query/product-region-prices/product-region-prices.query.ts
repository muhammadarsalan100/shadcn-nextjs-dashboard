import { getProductRegionPrices, type ProductRegionPrice } from "@/app/services/product-region-prices";
import { useQuery } from "@tanstack/react-query";

// Fetch all regional prices (across every size) for a product
export function useProductRegionPrices(productId: number | null) {
  return useQuery<ProductRegionPrice[]>({
    queryKey: ["product-region-prices", productId],
    queryFn: () => getProductRegionPrices(productId!),
    enabled: !!productId,
  });
}
