import { getLanguages, Language } from "@/app/services/languages";
import { useQuery } from "@tanstack/react-query";

export const useLanguages = () =>
  useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: getLanguages,
  });
