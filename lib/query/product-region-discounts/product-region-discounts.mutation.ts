import {
  createProductRegionDiscount,
  updateProductRegionDiscount,
  deleteProductRegionDiscount,
  type CreateProductRegionDiscountInput,
  type UpdateProductRegionDiscountInput,
} from "@/app/services/product-region-discounts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Add a regional discount to a product
export function useCreateProductRegionDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number;
      data: CreateProductRegionDiscountInput;
    }) => createProductRegionDiscount(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-discounts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

// Update a regional discount's percentage, schedule, and/or active status
export function useUpdateProductRegionDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRegionDiscountInput }) =>
      updateProductRegionDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-discounts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

// Remove a regional discount
export function useDeleteProductRegionDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProductRegionDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-region-discounts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
