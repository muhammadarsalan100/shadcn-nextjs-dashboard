import { createLanguage, updateLanguage, deleteLanguage } from "@/app/services/languages";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ------------------ CREATE ------------------
export const useCreateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { code: string; name: string }) => createLanguage(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["languages"] }),
  });
};

// ------------------ UPDATE ------------------
export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateLanguage(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["languages"] }),
  });
};

// ------------------ DELETE ------------------
export const useDeleteLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteLanguage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["languages"] }),
  });
};
