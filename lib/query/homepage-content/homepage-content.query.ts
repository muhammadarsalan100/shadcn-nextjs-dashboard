import {
  getHomepageContentAdmin,
  type HomepageContentAdmin,
} from "@/app/services/homepage-content";
import { useQuery, useQueries } from "@tanstack/react-query";

// Fetch the banner + carousel slides + gift cards for one region (admin view)
export function useHomepageContent(regionId: number | null) {
  return useQuery<HomepageContentAdmin>({
    queryKey: ["homepage-content", regionId],
    queryFn: () => getHomepageContentAdmin(regionId!),
    enabled: !!regionId,
  });
}

// Fetch homepage content for every region at once (the admin GET endpoint is
// per-region, so this fans out one query per region in parallel via useQueries).
export function useAllHomepageContent(regionIds: number[]) {
  const results = useQueries({
    queries: regionIds.map((id) => ({
      queryKey: ["homepage-content", id],
      queryFn: () => getHomepageContentAdmin(id),
    })),
  });

  return {
    isLoading: results.length > 0 && results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    data: results.map((r) => r.data).filter((d): d is HomepageContentAdmin => !!d),
  };
}
