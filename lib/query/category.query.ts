import { getCategories, getCategoryById, type Category, type CategoryDetails } from "@/app/services/categories";
import { useQuery } from "@tanstack/react-query";

export function useCategories(lang?: string) {
  return useQuery<Category[]>({
    queryKey: ["categories", lang],
    queryFn: () => getCategories(lang),
  });
}

export function useCategoryById(id: number | null) {
  return useQuery<CategoryDetails>({
    queryKey: ["categories", "detail", id],
    queryFn: () => getCategoryById(id!),
    enabled: !!id,
  });
}
