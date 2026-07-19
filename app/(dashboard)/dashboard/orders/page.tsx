"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { orderColumns } from "@/components/orders/columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Order,
  ORDER_STATUSES,
  getOrderStatusLabel,
} from "@/app/services/orders";
import { useOrders } from "@/lib/query/orders/orders.query";
import {
  useDeleteOrder,
  useUpdateOrder,
} from "@/lib/query/orders/orders.mutation";

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: orders, isLoading, isError } = useOrders(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );
  const updateMutation = useUpdateOrder();
  const deleteMutation = useDeleteOrder();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const confirmDelete = () => {
    if (!orderToDelete) return;
    deleteMutation.mutate(orderToDelete.id, {
      onSuccess: () => {
        toast.success("Order deleted successfully");
        setOrderToDelete(null);
      },
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Orders</h2>
          <p className="text-muted-foreground">
            Manage orders — status can be changed only when payment is Paid
          </p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {getOrderStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={orders}
            columns={orderColumns(updateMutation, setOrderToDelete)}
            isLoading={isLoading}
            error={isError}
            emptyMessage="No orders found"
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!orderToDelete}
        onOpenChange={(open) => {
          if (!open) setOrderToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to permanently delete order{" "}
            <span className="font-medium">
              {orderToDelete?.orderNumber || `#${orderToDelete?.id}`}
            </span>
            ? Associated items and payments will also be deleted. This does not
            restore product inventory.
          </p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOrderToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
