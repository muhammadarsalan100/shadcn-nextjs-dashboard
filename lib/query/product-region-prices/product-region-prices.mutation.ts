import {
  createProductRegionPrice,
  updateProductRegionPrice,
  deleteProductRegionPrice,
  type CreateProductRegionPriceInput,
  type UpdateProductRegionPriceInput,
} from "@/app/services/product-region-prices";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Add a regional price to a product size
export function useCreateProductRegionPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: CreateProductRegionPriceInput }) =>
      createProductRegionPrice(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-prices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

// Update a regional price's amount and/or active status
export function useUpdateProductRegionPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRegionPriceInput }) =>
      updateProductRegionPrice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-prices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

// Remove a regional price
export function useDeleteProductRegionPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProductRegionPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-prices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
