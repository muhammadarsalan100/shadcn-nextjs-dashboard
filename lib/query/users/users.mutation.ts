import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser, deleteUser, User } from "@/app/services/users";

// Fetch all users
export const useUsers = () =>
  useQuery<User[]>({
    queryKey: ["users"],
    queryFn: getUsers,
  });

// Update user (activate/deactivate or change role) with optimistic UI
type UpdatePayload = { id: number; active?: boolean; role?: "admin" | "user" };
type UpdateContext = { previousUsers?: User[] };

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdatePayload, UpdateContext>({
    mutationFn: ({ id, ...data }) => updateUser(id, data),

    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const previousUsers = queryClient.getQueryData<User[]>(["users"]);

      // Optimistic update
      queryClient.setQueryData<User[]>(["users"], (old) =>
        old?.map((u) => (u.id === id ? { ...u, ...data } : u))
      );

      return { previousUsers };
    },

    onError: (_err, _variables, context) => {
      // Rollback if mutation fails
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number>({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};