import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProductDiscount,
  updateProductDiscount,
  deleteProductDiscount,
  CreateProductDiscountInput,
  UpdateProductDiscountInput,
} from "@/app/services/product-discounts";

// ------------------ CREATE ------------------
export const useCreateProductDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDiscountInput) => createProductDiscount(data),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["product-discounts", variables.productId] }),
  });
};

// ------------------ UPDATE ------------------
export const useUpdateProductDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      productId: number;
      data: UpdateProductDiscountInput;
    }) => updateProductDiscount(id, data),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["product-discounts", variables.productId] }),
  });
};

// ------------------ DELETE ------------------
export const useDeleteProductDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; productId: number }) => deleteProductDiscount(id),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["product-discounts", variables.productId] }),
  });
};
