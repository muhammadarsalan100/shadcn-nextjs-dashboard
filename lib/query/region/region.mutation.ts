import { getRegions, Region } from "@/app/services/region";
import { useQuery } from "@tanstack/react-query";

export const useRegions = () =>
  useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: getRegions,
  });
