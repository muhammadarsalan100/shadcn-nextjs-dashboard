import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRegion, updateRegion, deleteRegion, CreateRegionInput, UpdateRegionInput } from "@/app/services/region";

// ------------------ CREATE ------------------
export const useCreateRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRegionInput) => createRegion(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regions"] }),
  });
};

// ------------------ UPDATE ------------------
export const useUpdateRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRegionInput }) =>
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