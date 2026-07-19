"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash } from "lucide-react";
import { Region } from "@/app/services/region";
import { Column } from "@/components/shared/data-table";

export const regionColumns = (
  onEditClick: (region: Region) => void,
  onDeleteClick: (region: Region) => void
): Column<Region>[] => [
  { header: "Name", accessorKey: "name" },
  { header: "Currency", accessorKey: "currencyCode" },
  { header: "Price %", accessorKey: "pricePercentage" },
  { header: "Conversion Rate", accessorKey: "conversionRate" },
  { header: "Shipping Amount", accessorKey: "shippingAmount" },
  { header: "TZ Offset (min)", accessorKey: "timeZoneOffsetMinutes" },
  {
    header: "Status",
    accessorKey: "active",
    cell: (region: Region) => (
      <Badge
        className={
          region.active
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-red-200 bg-red-50 text-red-700 hover:bg-red-50 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300"
        }
      >
        {region.active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    header: "Actions",
    className: "text-right",
    cell: (region: Region) => (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEditClick(region)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDeleteClick(region)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
