"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProducts } from "@/lib/query/products/products.query";
import { useRegions } from "@/lib/query/region/region.query";
import { useProductDiscountsByProduct } from "@/lib/query/product-discounts/product-discounts.query";
import {
  useCreateProductDiscount,
  useUpdateProductDiscount,
  useDeleteProductDiscount,
} from "@/lib/query/product-discounts/product-discounts.mutation";
import { DataTable } from "@/components/shared/data-table";
import { productDiscountColumns } from "@/components/product-discounts/columns";
import { Switch } from "@/components/ui/switch";
import { ProductDiscount } from "@/app/services/product-discounts";

type DiscountFormValues = {
  regionId: string;
  discountPercentage: number;
  startDateTime: string;
  endDateTime: string;
  active: boolean;
};

// Converts an ISO datetime string to the "YYYY-MM-DDTHH:mm" format required by <input type="datetime-local">
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DiscountsPage() {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedProductId === null && products && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const {
    data: discounts,
    isLoading: discountsLoading,
    isError: discountsError,
  } = useProductDiscountsByProduct(selectedProductId);

  const createMutation = useCreateProductDiscount();
  const updateMutation = useUpdateProductDiscount();
  const deleteMutation = useDeleteProductDiscount();

  const [openForm, setOpenForm] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState<ProductDiscount | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    defaultValues: {
      regionId: "",
      discountPercentage: 0,
      startDateTime: "",
      endDateTime: "",
      active: true,
    },
  });

  const activeValue = watch("active");
  const regionIdValue = watch("regionId");

  const handleAddClick = () => {
    setCurrentDiscount(null);
    reset({ regionId: "", discountPercentage: 0, startDateTime: "", endDateTime: "", active: true });
    setOpenForm(true);
  };

  const handleEditClick = (discount: ProductDiscount) => {
    setCurrentDiscount(discount);
    reset({
      regionId: String(discount.regionId),
      discountPercentage: discount.discountPercentage,
      startDateTime: toDatetimeLocalValue(discount.startDateTime),
      endDateTime: toDatetimeLocalValue(discount.endDateTime),
      active: discount.active,
    });
    setOpenForm(true);
  };

  const onSubmit = (data: DiscountFormValues) => {
    if (!selectedProductId) return;

    if (currentDiscount) {
      updateMutation.mutate(
        {
          id: currentDiscount.id,
          productId: selectedProductId,
          data: {
            regionId: Number(data.regionId),
            discountPercentage: Number(data.discountPercentage),
            startDateTime: new Date(data.startDateTime).toISOString(),
            endDateTime: data.endDateTime ? new Date(data.endDateTime).toISOString() : null,
            active: data.active,
          },
        },
        { onSuccess: () => setOpenForm(false) }
      );
    } else {
      createMutation.mutate(
        {
          productId: selectedProductId,
          regionId: Number(data.regionId),
          discountPercentage: Number(data.discountPercentage),
          startDateTime: new Date(data.startDateTime).toISOString(),
          endDateTime: data.endDateTime ? new Date(data.endDateTime).toISOString() : null,
          active: data.active,
        },
        { onSuccess: () => setOpenForm(false) }
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Discounts</h2>
          <p className="text-muted-foreground">Manage discounts per product.</p>
        </div>
        <Button
          onClick={handleAddClick}
          disabled={!selectedProductId}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Discount
        </Button>
      </div>

      {/* Product picker */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="flex-1 max-w-sm">
            <Select
              value={selectedProductId ? String(selectedProductId) : undefined}
              onValueChange={(value) => setSelectedProductId(Number(value))}
              disabled={productsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.title || `Product #${product.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={discounts}
            columns={productDiscountColumns(deleteMutation, handleEditClick, regions)}
            isLoading={selectedProductId ? discountsLoading : false}
            error={discountsError}
            emptyMessage={
              selectedProductId ? "No discounts found for this product" : "Select a product to view its discounts"
            }
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentDiscount ? "Edit Discount" : "Add Discount"}</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="block font-medium">Region</label>
              <input
                type="hidden"
                {...register("regionId", { required: "Region is required" })}
              />
              <Select
                value={regionIdValue || undefined}
                onValueChange={(value) => setValue("regionId", value)}
                disabled={regionsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {regions?.map((region) => (
                    <SelectItem key={region.id} value={String(region.id)}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.regionId && (
                <p className="text-red-500 text-sm">{errors.regionId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Discount Percentage</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("discountPercentage", {
                  required: "Discount percentage is required",
                  valueAsNumber: true,
                })}
                placeholder="e.g. 15.00"
              />
              {errors.discountPercentage && (
                <p className="text-red-500 text-sm">{errors.discountPercentage.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Start Date/Time</label>
              <Input
                type="datetime-local"
                {...register("startDateTime", { required: "Start date/time is required" })}
              />
              {errors.startDateTime && (
                <p className="text-red-500 text-sm">{errors.startDateTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">End Date/Time (optional)</label>
              <Input type="datetime-local" {...register("endDateTime")} />
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium">Active</label>
              <Switch
                checked={activeValue}
                onCheckedChange={(checked) => setValue("active", checked)}
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" type="button" onClick={() => setOpenForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {currentDiscount
                  ? updateMutation.isPending
                    ? "Updating..."
                    : "Update"
                  : createMutation.isPending
                  ? "Creating..."
                  : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
