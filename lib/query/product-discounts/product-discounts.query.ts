import { getProductDiscountsByProduct, type ProductDiscount } from "@/app/services/product-discounts";
import { useQuery } from "@tanstack/react-query";

export const useProductDiscountsByProduct = (productId: number | null) =>
  useQuery<ProductDiscount[]>({
    queryKey: ["product-discounts", productId],
    queryFn: () => getProductDiscountsByProduct(productId!),
    enabled: !!productId,
  });
