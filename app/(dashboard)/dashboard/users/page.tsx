"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { userColumns } from "@/components/users/columns";
import { User } from "@/app/services/users";
import { useDeleteUser, useUpdateUser } from "@/lib/query/users/users.mutation";
import { useUsers } from "@/lib/query/users/users.query";

export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
            columns={userColumns(updateMutation, setUserToDelete)}
            isLoading={isLoading}
            error={isError}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete user{" "}
            <span className="font-medium">
              {userToDelete?.name || userToDelete?.email}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!userToDelete) return;
                deleteMutation.mutate(userToDelete.id, {
                  onSuccess: () => setUserToDelete(null),
                });
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
