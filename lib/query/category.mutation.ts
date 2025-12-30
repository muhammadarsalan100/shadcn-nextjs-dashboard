import { createCategory, deleteCategory, updateCategory } from "@/app/services/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateCategory() {
      const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: string) => createCategory(category),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] }); 
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] }); 
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
