"use client";

import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userColumns } from "@/components/users/columns";
import { useDeleteUser, useUpdateUser } from "@/lib/query/users/users.mutation";
import { useUsers } from "@/lib/query/users/users.query";


export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold">Users</h2>
        <p className="text-muted-foreground">Manage all users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={users}
            columns={userColumns(updateMutation, deleteMutation)}
            isLoading={isLoading}
            error={isError}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
