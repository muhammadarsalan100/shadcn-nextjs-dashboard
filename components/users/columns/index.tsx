"use client";

import { User } from "@/app/services/users";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, CheckCircle, Trash2 } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { Column } from "@/components/shared/data-table";

type UpdateMutation = UseMutationResult<User, Error, { id: number; active?: boolean; role?: User["role"] }>;

export const userColumns = (
  toggleMutation: UpdateMutation,
  onDeleteClick: (user: User) => void,
  roles: User["role"][] = ["admin", "user"]
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
        }
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
      <span
        className={
          user.active
            ? "inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "inline-flex rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300"
        }
      >
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
          onClick={() => onDeleteClick(user)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
