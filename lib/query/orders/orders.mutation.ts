import {
  deleteOrder,
  Order,
  updateOrder,
  UpdateOrderInput,
} from "@/app/services/orders";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UpdatePayload = { id: number } & UpdateOrderInput;

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, UpdatePayload>({
    mutationFn: ({ id, ...data }) => updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update order"
      );
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation<{ status?: string; message?: string }, Error, number>({
    mutationFn: (id: number) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete order"
      );
    },
  });
}
