import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRegion, updateRegion, deleteRegion } from "@/app/services/region";

// ------------------ CREATE ------------------
export const useCreateRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; pricePercentage: number }) => createRegion(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regions"] }),
  });
};

// ------------------ UPDATE ------------------
export const useUpdateRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; pricePercentage: number } }) =>
      updateRegion(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regions"] }),
  });
};

// ------------------ DELETE ------------------
export const useDeleteRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRegion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regions"] }),
  });
};
