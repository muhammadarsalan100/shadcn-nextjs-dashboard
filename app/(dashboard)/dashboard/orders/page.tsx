"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { Pagination, DEFAULT_PAGE_SIZE } from "@/components/shared/pagination";
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
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/orders/status-badge";
import { downloadOrderReceipt } from "@/components/orders/download-receipt";
import {
  Calendar,
  CreditCard,
  Download,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
} from "lucide-react";
import {
  Order,
  ORDER_STATUSES,
  formatOrderMoney,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/app/services/orders";
import { useOrders } from "@/lib/query/orders/orders.query";
import {
  useDeleteOrder,
  useUpdateOrder,
} from "@/lib/query/orders/orders.mutation";

function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { data: orders, isLoading, isError } = useOrders({
    ...(statusFilter === "all" ? {} : { status: statusFilter }),
    page,
    limit: pageSize,
  });
  const updateMutation = useUpdateOrder();
  const deleteMutation = useDeleteOrder();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToView, setOrderToView] = useState<Order | null>(null);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

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

        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
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
            data={orders?.data}
            columns={orderColumns(updateMutation, setOrderToDelete, setOrderToView)}
            isLoading={isLoading}
            error={isError}
            emptyMessage="No orders found"
          />
          <Pagination
            page={orders?.page ?? page}
            totalPages={orders?.totalPages ?? 1}
            onPageChange={setPage}
            totalResults={orders?.totalResults}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
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

      <Dialog
        open={!!orderToView}
        onOpenChange={(open) => {
          if (!open) setOrderToView(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scroll-smooth rounded-2xl shadow-2xl">
          {orderToView && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-pink-500 text-white shadow-md shadow-amber-500/20">
                    <Package className="h-5 w-5" />
                  </span>
                  <span className="font-mono">
                    {orderToView.orderNumber || `#${orderToView.id}`}
                  </span>
                </DialogTitle>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Placed {formatOrderDate(orderToView.createdAt)}
                </p>
              </DialogHeader>

              <div
                className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: "40ms" }}
              >
                <StatusBadge
                  status={orderToView.status}
                  label={getOrderStatusLabel(orderToView.status)}
                  className="rounded-full px-3 py-1 shadow-sm"
                />
                <StatusBadge
                  status={orderToView.paymentStatus}
                  label={`Payment: ${getPaymentStatusLabel(orderToView.paymentStatus)}`}
                  className="rounded-full px-3 py-1 shadow-sm"
                />
              </div>

              <div
                className="grid gap-5 rounded-2xl border bg-gradient-to-br from-muted/40 to-muted/10 p-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: "80ms" }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                      <User className="h-3.5 w-3.5" />
                    </span>
                    Customer
                  </div>
                  <p className="font-medium">{orderToView.customerName || "—"}</p>
                  {orderToView.customerEmail && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {orderToView.customerEmail}
                    </p>
                  )}
                  {orderToView.customerPhone && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {orderToView.customerPhone}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                    Shipping Address
                  </div>
                  <p className="font-medium">{orderToView.shippingAddress || "—"}</p>
                  <p className="text-sm text-muted-foreground">{orderToView.country}</p>
                </div>
              </div>

              <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: "120ms" }}
              >
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Package className="h-4 w-4" />
                  Items
                </h4>
                <div className="divide-y rounded-2xl border overflow-hidden">
                  {orderToView.items?.map((item) => {
                    const discount = Number(item.discountPercentage) || 0;
                    const finalPrice = Number(item.finalPrice) || 0;
                    const originalPrice = Number(item.price) || finalPrice;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 text-sm transition-colors duration-200 hover:bg-muted/50"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.productName}
                            className="h-12 w-12 shrink-0 rounded-lg border object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.productName}</p>
                          <p className="text-muted-foreground">
                            {item.size} · Qty {item.quantity}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {discount > 0 && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatOrderMoney(originalPrice, orderToView.currency)}
                            </p>
                          )}
                          <p className="font-semibold">
                            {formatOrderMoney(finalPrice, orderToView.currency)}
                          </p>
                          {discount > 0 && (
                            <span className="mt-0.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                              {discount}% off
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {orderToView.payments && orderToView.payments.length > 0 && (
                <div
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: "160ms" }}
                >
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <CreditCard className="h-4 w-4" />
                    Payments
                  </h4>
                  <div className="divide-y rounded-2xl border overflow-hidden">
                    {orderToView.payments.map((payment) => {
                      const reference = payment.transactionId || payment.gatewayOrderId;
                      return (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between gap-3 p-3 text-sm transition-colors duration-200 hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                              <CreditCard className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-medium">
                                {getPaymentMethodLabel(payment.paymentMethod)}
                              </p>
                              {reference && (
                                <p className="text-xs text-muted-foreground">{reference}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              status={payment.status}
                              label={getPaymentStatusLabel(payment.status)}
                              className="rounded-full"
                            />
                            <span className="font-semibold">
                              {formatOrderMoney(payment.amount, payment.currency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                className="rounded-2xl border bg-gradient-to-br from-amber-500/5 to-pink-500/5 p-4 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatOrderMoney(orderToView.subtotal, orderToView.currency)}</span>
                </div>
                {Number(orderToView.discountAmount) > 0 && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      −{formatOrderMoney(orderToView.discountAmount, orderToView.currency)}
                    </span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {Number(orderToView.shippingAmount) > 0
                      ? formatOrderMoney(orderToView.shippingAmount, orderToView.currency)
                      : "Free"}
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="bg-gradient-to-r from-amber-600 to-pink-600 bg-clip-text text-xl font-bold text-transparent dark:from-amber-400 dark:to-pink-400">
                    {formatOrderMoney(orderToView.totalAmount, orderToView.currency)}
                  </span>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderToView(null)}>
              Close
            </Button>
            {orderToView && (
              <Button
                onClick={() => downloadOrderReceipt(orderToView)}
                className="gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
