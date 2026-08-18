import { getOrders, GetOrdersParams, PaginatedOrders } from "@/app/services/orders";
import { useQuery } from "@tanstack/react-query";

export function useOrders(params?: GetOrdersParams) {
  return useQuery<PaginatedOrders>({
    queryKey: [
      "orders",
      params?.status ?? "all",
      params?.page ?? 1,
      params?.limit ?? 50,
    ],
    queryFn: () => getOrders(params),
  });
}
