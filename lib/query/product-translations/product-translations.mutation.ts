import {
  createProductTranslation,
  updateProductTranslation,
  deleteProductTranslation,
  type CreateProductTranslationInput,
  type UpdateProductTranslationInput,
} from "@/app/services/product-translations";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateProductTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductTranslationInput) => createProductTranslation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useUpdateProductTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductTranslationInput }) =>
      updateProductTranslation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useDeleteProductTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProductTranslation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
