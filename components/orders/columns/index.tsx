"use client";

import {
  formatOrderMoney,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  Order,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  UpdateOrderInput,
} from "@/app/services/orders";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Column } from "@/components/shared/data-table";
import { cn } from "@/lib/utils";
import { UseMutationResult } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

type UpdateMutation = UseMutationResult<
  Order,
  Error,
  { id: number } & UpdateOrderInput
>;

type StatusTone = "success" | "fail" | "pending" | "neutral";

function isPaid(paymentStatus: string): boolean {
  const s = (paymentStatus || "").toUpperCase();
  return ["PAID", "CAPTURED", "SUCCESS"].includes(s);
}

function getStatusTone(status: string): StatusTone {
  const s = (status || "").toUpperCase();

  if (
    ["DELIVERED", "PAID", "CAPTURED", "SUCCESS", "CONFIRM", "CONFIRMED"].includes(
      s
    )
  ) {
    return "success";
  }
  if (["FAILED"].includes(s)) {
    return "fail";
  }
  if (
    [
      "PENDING",
      "PROCESSING",
      "CUSTOM_CLEARANCE",
      "CUSTOMS_CLEARANCE",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "REFUNDED",
      "COD",
    ].includes(s)
  ) {
    return "pending";
  }
  return "neutral";
}

const toneTriggerClass: Record<StatusTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-200/60 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 [&_svg]:text-emerald-700 [&_svg]:opacity-100 dark:[&_svg]:text-emerald-300",
  fail:
    "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-200/60 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 [&_svg]:text-red-600 [&_svg]:opacity-100 dark:[&_svg]:text-red-300",
  pending:
    "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus:ring-amber-200/60 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60 [&_svg]:text-amber-700 [&_svg]:opacity-100 dark:[&_svg]:text-amber-300",
  neutral: "[&_svg]:opacity-70",
};

const toneBadgeClass: Record<StatusTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  fail:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300",
  pending:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  neutral: "bg-muted text-muted-foreground border-border",
};

export const orderColumns = (
  updateMutation: UpdateMutation,
  onDeleteClick: (order: Order) => void
): Column<Order>[] => [
  {
    header: "Order #",
    cell: (order) => (
      <span className="font-mono text-sm font-medium">
        {order.orderNumber || `#${order.id}`}
      </span>
    ),
  },
  {
    header: "Customer",
    cell: (order) => (
      <div className="min-w-[160px]">
        <div className="font-medium">{order.customerName || "—"}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[220px]">
          {order.customerEmail || order.customerPhone || "—"}
        </div>
      </div>
    ),
  },
  {
    header: "Items",
    cell: (order) => {
      const count =
        order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
      return <span className="text-muted-foreground">{count}</span>;
    },
  },
  {
    header: "Total",
    cell: (order) => (
      <span className="font-semibold">
        {formatOrderMoney(order.totalAmount, order.currency)}
      </span>
    ),
  },
  {
    header: "Payment",
    cell: (order) => {
      const current = order.paymentStatus?.toUpperCase() || "";
      const known = PAYMENT_STATUSES.includes(
        current as (typeof PAYMENT_STATUSES)[number]
      );
      const tone = getStatusTone(order.paymentStatus);
      return (
        <Select
          value={known ? current : undefined}
          onValueChange={(paymentStatus) =>
            updateMutation.mutate(
              { id: order.id, paymentStatus },
              {
                onSuccess: () => toast.success("Payment status updated"),
              }
            )
          }
          disabled={
            updateMutation.isPending && updateMutation.variables?.id === order.id
          }
        >
          <SelectTrigger
            className={cn("w-[150px] font-medium shadow-sm", toneTriggerClass[tone])}
          >
            <SelectValue placeholder={getPaymentStatusLabel(order.paymentStatus)}>
              {getPaymentStatusLabel(order.paymentStatus)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {getPaymentStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
  },
  {
    header: "Status",
    cell: (order) => {
      const paid = isPaid(order.paymentStatus);
      const current = order.status?.toUpperCase() || "";
      const known = ORDER_STATUSES.includes(
        current as (typeof ORDER_STATUSES)[number]
      );
      const tone = getStatusTone(order.status);

      if (!paid) {
        return (
          <span
            className={cn(
              "inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium",
              toneBadgeClass[tone]
            )}
            title="Status can only be changed when payment is Paid"
          >
            {getOrderStatusLabel(order.status)}
          </span>
        );
      }

      return (
        <Select
          value={known ? current : undefined}
          onValueChange={(status) =>
            updateMutation.mutate(
              { id: order.id, status },
              {
                onSuccess: () => toast.success("Order status updated"),
              }
            )
          }
          disabled={
            updateMutation.isPending && updateMutation.variables?.id === order.id
          }
        >
          <SelectTrigger
            className={cn("w-[180px] font-medium shadow-sm", toneTriggerClass[tone])}
          >
            <SelectValue placeholder={getOrderStatusLabel(order.status)}>
              {getOrderStatusLabel(order.status)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {getOrderStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
  },
  {
    header: "Country",
    accessorKey: "country",
  },
  {
    header: "Date",
    cell: (order) => {
      const d = new Date(order.createdAt);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    },
  },
  {
    header: "Actions",
    className: "text-right",
    cell: (order) => (
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDeleteClick(order)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
