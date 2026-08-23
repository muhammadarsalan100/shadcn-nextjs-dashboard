import {
  createProductRegionPromotion,
  updateProductRegionPromotion,
  deleteProductRegionPromotion,
  type CreateProductRegionPromotionInput,
  type UpdateProductRegionPromotionInput,
} from "@/app/services/product-region-promotions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Add a regional promotion (free shipping / welcome offer) to a product
export function useCreateProductRegionPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number;
      data: CreateProductRegionPromotionInput;
    }) => createProductRegionPromotion(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

// Update an existing regional promotion
export function useUpdateProductRegionPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRegionPromotionInput }) =>
      updateProductRegionPromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

// Remove a regional promotion
export function useDeleteProductRegionPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProductRegionPromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-promotions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
