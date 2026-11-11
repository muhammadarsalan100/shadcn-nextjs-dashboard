import { getOrders, GetOrdersParams, AdminOrdersResponse } from "@/app/services/orders";
import { useQuery } from "@tanstack/react-query";

export function useOrders(params?: GetOrdersParams) {
  return useQuery<AdminOrdersResponse>({
    queryKey: ["orders", params ?? {}],
    queryFn: () => getOrders(params),
  });
}
