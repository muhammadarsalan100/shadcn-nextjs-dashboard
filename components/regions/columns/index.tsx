"use client";


import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { Region } from "@/app/services/region";
import { Column } from "@/components/shared/data-table";

type DeleteMutation = UseMutationResult<{ message: string }, Error, number>;

export const regionColumns = (
  deleteMutation: DeleteMutation,
  onEditClick: (region: Region) => void
): Column<Region>[] => [
  { header: "Name", accessorKey: "name" },
  { header: "Price %", accessorKey: "pricePercentage" },
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
          disabled={deleteMutation.isPending && deleteMutation.variables === region.id}
          onClick={() => deleteMutation.mutate(region.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
