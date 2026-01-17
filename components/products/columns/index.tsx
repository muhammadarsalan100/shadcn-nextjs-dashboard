"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash, Package, Ruler, Plus, Pencil } from "lucide-react";
import { Product } from "@/app/services/products";
import { Column } from "@/components/shared/data-table";

export const productColumns = (
  onManageSizesClick?: (product: Product) => void,
  onEditClick?: (product: Product) => void,
  onDeleteClick?: (id: number) => void
): Column<Product>[] => [
  {
    header: "Image",
    className: "w-[70px]",
    cell: (product: Product) => (
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-pink-100 dark:from-amber-900/20 dark:to-pink-900/20 flex items-center justify-center">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title || "Product"}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="h-5 w-5 text-amber-500/50" />
        )}
      </div>
    )
  },
  { 
    header: "ID", 
    accessorKey: "id",
    className: "w-[60px] font-mono text-muted-foreground"
  },
  { 
    header: "Title", 
    accessorKey: "title",
    className: "max-w-[250px]",
    cell: (product: Product) => (
      <div className="truncate font-medium" title={product.title || ""}>
        {product.title || <span className="text-muted-foreground italic">No English translation</span>}
      </div>
    )
  },
  { 
    header: "Description", 
    className: "max-w-[300px]",
    cell: (product: Product) => (
      <div className="truncate text-muted-foreground text-sm" title={product.description || ""}>
        {product.description || <span className="italic">—</span>}
      </div>
    )
  },
  { 
    header: "Price", 
    cell: (product: Product) => (
      <span className="font-semibold text-amber-600">
        ${product.price}
      </span>
    )
  },
  { 
    header: "Discount", 
    cell: (product: Product) => {
      const discount = Number(product.discountPercentage);
      return discount > 0 ? (
        <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          -{discount}%
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    }
  },
  { 
    header: "Stock", 
    cell: (product: Product) => (
      <Badge 
        variant={product.inStock ? "default" : "destructive"}
        className={product.inStock 
          ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
          : ""
        }
      >
        {product.inStock ? "In Stock" : "Out of Stock"}
      </Badge>
    )
  },
  {
    header: "Actions",
    className: "text-right w-[240px]",
    cell: (product: Product) => (
      <div className="flex justify-end gap-1">
        {onManageSizesClick && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onManageSizesClick(product)}
            className="gap-1 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
          >
            <Plus className="h-3 w-3" />
            <Ruler className="h-4 w-4" />
          </Button>
        )}
        {onEditClick && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditClick(product)}
            title="Edit Product"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {onDeleteClick && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDeleteClick(product.id)}
            title="Delete Product"
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
    ),
  },
];
