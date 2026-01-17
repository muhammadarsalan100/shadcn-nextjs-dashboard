import { getRegions, getRegionById, Region } from "@/app/services/region";
import { useQuery } from "@tanstack/react-query";

export const useRegions = () =>
  useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: getRegions,
  });

export const useRegionById = (id: number) =>
  useQuery<Region>({
    queryKey: ["regions", id],
    queryFn: () => getRegionById(id),
    enabled: !!id,
  });
