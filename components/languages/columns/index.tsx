"use client";

import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Language } from "@/app/services/languages";
import { Column } from "@/components/shared/data-table";

export const languageColumns = (
  onEditClick: (language: Language) => void,
  onDeleteClick: (id: number) => void
): Column<Language>[] => [
  { header: "Code", accessorKey: "code", className: "font-mono" },
  { header: "Name", accessorKey: "name" },
  {
    header: "Actions",
    className: "text-right",
    cell: (language: Language) => (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEditClick(language)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDeleteClick(language.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
