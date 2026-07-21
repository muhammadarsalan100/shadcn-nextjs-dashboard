"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash, Edit } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { ProductDiscount } from "@/app/services/product-discounts";
import { Region } from "@/app/services/region";
import { Column } from "@/components/shared/data-table";

type DeleteMutation = UseMutationResult<
  { message: string },
  Error,
  { id: number; productId: number }
>;

export const productDiscountColumns = (
  deleteMutation: DeleteMutation,
  onEditClick: (discount: ProductDiscount) => void,
  regions?: Region[]
): Column<ProductDiscount>[] => [
  { header: "ID", accessorKey: "id", className: "w-[60px] font-mono text-muted-foreground" },
  {
    header: "Region",
    cell: (discount: ProductDiscount) =>
      regions?.find((r) => r.id === discount.regionId)?.name ?? `Region #${discount.regionId}`,
  },
  {
    header: "Discount %",
    cell: (discount: ProductDiscount) => (
      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        -{discount.discountPercentage}%
      </Badge>
    ),
  },
  {
    header: "Start Date",
    cell: (discount: ProductDiscount) => new Date(discount.startDateTime).toLocaleString(),
  },
  {
    header: "End Date",
    cell: (discount: ProductDiscount) =>
      discount.endDateTime ? new Date(discount.endDateTime).toLocaleString() : <span className="text-muted-foreground">-</span>,
  },
  {
    header: "Status",
    cell: (discount: ProductDiscount) => (
      <Badge variant={discount.active ? "default" : "secondary"}>
        {discount.active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    header: "Actions",
    className: "text-right",
    cell: (discount: ProductDiscount) => (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEditClick(discount)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={
            deleteMutation.isPending && deleteMutation.variables?.id === discount.id
          }
          onClick={() =>
            deleteMutation.mutate({ id: discount.id, productId: discount.productId })
          }
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
