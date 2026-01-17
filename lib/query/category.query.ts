import { getCategories } from "@/app/services/categories";
import { useQuery } from "@tanstack/react-query";

export function useCategories(lang?: string) {
  return useQuery({
    queryKey: ["categories", lang],
    queryFn: () => getCategories(lang),
  });
}
