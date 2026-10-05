import {
  getProducts,
  getProduct,
  type GetProductsParams,
  type PaginatedProducts,
  type ProductDetails,
} from "@/app/services/products";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useProducts(params?: GetProductsParams) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  return useQuery<PaginatedProducts>({
    queryKey: ["products", page, limit],
    queryFn: () => getProducts({ page, limit }),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: number | null) {
  return useQuery<ProductDetails>({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });
}
