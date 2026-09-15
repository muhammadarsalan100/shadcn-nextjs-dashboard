import {
  createProductSize,
  updateProductSize,
  deleteProductSize,
  getProductSizes,
  type CreateProductSizeInput,
  type UpdateProductSizeInput,
  type ProductSize,
} from "@/app/services/product-sizes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query to get product sizes
export function useProductSizes(productId: number | null) {
  return useQuery<ProductSize[]>({
    queryKey: ["product-sizes", productId],
    queryFn: () => getProductSizes(productId!),
    enabled: !!productId,
  });
}

export function useCreateProductSize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductSizeInput) => createProductSize(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["product-sizes"] });
      // A new size is created with its regional prices in one backend call,
      // so the prices list needs refreshing too or the new size shows as unpriced.
      queryClient.invalidateQueries({ queryKey: ["product-region-prices"] });
    },
  });
}

export function useUpdateProductSize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductSizeInput }) =>
      updateProductSize(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["product-sizes"] });
    },
  });
}

export function useDeleteProductSize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProductSize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["product-sizes"] });
    },
  });
}
