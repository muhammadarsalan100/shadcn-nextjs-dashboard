import { getProducts, getProduct, type Product, type ProductDetails } from "@/app/services/products";
import { useQuery } from "@tanstack/react-query";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });
}

export function useProduct(id: number | null) {
  return useQuery<ProductDetails>({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });
}
