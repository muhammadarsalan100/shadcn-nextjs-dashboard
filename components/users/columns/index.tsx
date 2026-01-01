"use client";

import { User } from "@/app/services/users";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, CheckCircle, Trash2 } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { Column } from "@/components/shared/data-table";

type UpdateMutation = UseMutationResult<User, Error, { id: number; active?: boolean; role?: User["role"] }>;
type DeleteMutation = UseMutationResult<{ message: string }, Error, number>;

export const userColumns = (
  toggleMutation: UpdateMutation,
  deleteMutation: DeleteMutation,
  roles: User["role"][] = ["admin", "user"] // List of all roles
): Column<User>[] => [
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Role",
    cell: (user: User) => (
      <Select
        defaultValue={user.role}
        onValueChange={(newRole) =>
          toggleMutation.mutate({ id: user.id, role: newRole as User["role"] })
        }
        disabled={
          !user.active || (toggleMutation.isPending && toggleMutation.variables?.id === user.id)
        } // ✅ Disable if user is inactive
      >
        <SelectTrigger>
          <SelectValue>{user.role}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roles.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  },
  {
    header: "Status",
    cell: (user: User) => (
      <span className={user.active ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
        {user.active ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    header: "Actions",
    className: "text-right",
    cell: (user: User) => (
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant={user.active ? "destructive" : "outline"}
          disabled={toggleMutation.isPending && toggleMutation.variables?.id === user.id}
          onClick={() => toggleMutation.mutate({ id: user.id, active: !user.active })}
        >
          {user.active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {user.active ? "Deactivate" : "Activate"}
        </Button>

        <Button
          size="sm"
          variant="destructive"
          disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
          onClick={() => deleteMutation.mutate(user.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];