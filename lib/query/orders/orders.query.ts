import { getOrders, GetOrdersParams } from "@/app/services/orders";
import { useQuery } from "@tanstack/react-query";

export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: ["orders", params?.status ?? "all"],
    queryFn: () => getOrders(params),
  });
}
