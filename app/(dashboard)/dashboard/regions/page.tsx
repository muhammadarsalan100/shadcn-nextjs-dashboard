"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRegions } from "@/lib/query/region/region.query";
import { useCreateRegion, useDeleteRegion, useUpdateRegion } from "@/lib/query/region/region.mutation";
import { Region } from "@/app/services/region";
import { DataTable } from "@/components/shared/data-table";
import { regionColumns } from "@/components/regions/columns";
import { Switch } from "@/components/ui/switch";

type RegionFormValues = {
  name: string;
  currencyCode: string;
  pricePercentage: number;
  conversionRate: number;
  shippingAmount: number;
  timeZoneOffsetMinutes: number;
  active: boolean;
};

export default function RegionsPage() {
  const { data: regions, isLoading, isError } = useRegions();
  const deleteMutation = useDeleteRegion();
  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();

  const [openForm, setOpenForm] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [regionToDelete, setRegionToDelete] = useState<Region | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegionFormValues>({
    defaultValues: {
      name: "",
      currencyCode: "",
      pricePercentage: 0,
      conversionRate: 1,
      shippingAmount: 0,
      timeZoneOffsetMinutes: 0,
      active: true
    },
  });

  const activeValue = watch("active");

  const handleEditClick = (region: Region) => {
    setCurrentRegion(region);
    reset({
      name: region.name,
      currencyCode: region.currencyCode,
      pricePercentage: region.pricePercentage,
      conversionRate: region.conversionRate,
      shippingAmount: region.shippingAmount,
      timeZoneOffsetMinutes: region.timeZoneOffsetMinutes,
      active: region.active
    });
    setOpenForm(true);
  };

  const handleAddClick = () => {
    setCurrentRegion(null);
    reset({
      name: "",
      currencyCode: "",
      pricePercentage: 0,
      conversionRate: 1,
      shippingAmount: 0,
      timeZoneOffsetMinutes: 0,
      active: true
    });
    setOpenForm(true);
  };

  const onSubmit = (data: RegionFormValues) => {
    if (currentRegion) {
      // Update
      updateMutation.mutate(
        {
          id: currentRegion.id,
          data: {
            name: data.name,
            currencyCode: data.currencyCode,
            pricePercentage: Number(data.pricePercentage),
            conversionRate: Number(data.conversionRate),
            shippingAmount: Number(data.shippingAmount),
            timeZoneOffsetMinutes: Number(data.timeZoneOffsetMinutes),
            active: data.active
          }
        },
        { onSuccess: () => setOpenForm(false) }
      );
    } else {
      // Create
      createMutation.mutate(
        {
          name: data.name,
          currencyCode: data.currencyCode,
          pricePercentage: Number(data.pricePercentage),
          conversionRate: Number(data.conversionRate),
          shippingAmount: Number(data.shippingAmount),
          timeZoneOffsetMinutes: Number(data.timeZoneOffsetMinutes),
          active: data.active
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
          <h2 className="text-3xl font-bold">Regions</h2>
          <p className="text-muted-foreground">Manage all regions.</p>
        </div>
        <Button onClick={handleAddClick} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Region
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Search regions..." className="pl-8" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </CardContent>
      </Card>

      {/* Regions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Regions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={regions}
            columns={regionColumns(handleEditClick, setRegionToDelete)}
            isLoading={isLoading}
            error={isError}
            emptyMessage="No regions found"
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!regionToDelete}
        onOpenChange={(open) => {
          if (!open) setRegionToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete region{" "}
            <span className="font-medium">{regionToDelete?.name}</span>? This
            action cannot be undone.
          </p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRegionToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!regionToDelete) return;
                deleteMutation.mutate(regionToDelete.id, {
                  onSuccess: () => setRegionToDelete(null),
                });
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentRegion ? "Edit Region" : "Add Region"}</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="block font-medium">Region Name</label>
              <Input
                {...register("name", { required: "Region name is required" })}
                placeholder="e.g. Pakistan"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Currency Code</label>
              <Input
                {...register("currencyCode", { 
                  required: "Currency code is required",
                  pattern: {
                    value: /^[A-Z]{3}$/,
                    message: "Must be a 3-letter ISO currency code (e.g. PKR, USD)"
                  }
                })}
                placeholder="e.g. PKR"
                className="uppercase"
                maxLength={3}
              />
              {errors.currencyCode && <p className="text-red-500 text-sm">{errors.currencyCode.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Price Percentage</label>
              <Input
                type="number"
                step="0.01"
                {...register("pricePercentage", { 
                  required: "Price percentage is required",
                  valueAsNumber: true
                })}
                placeholder="e.g. 10.00"
              />
              {errors.pricePercentage && (
                <p className="text-red-500 text-sm">{errors.pricePercentage.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Conversion Rate</label>
              <Input
                type="number"
                step="0.01"
                {...register("conversionRate", { 
                  required: "Conversion rate is required",
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Conversion rate must be at least 1"
                  }
                })}
                placeholder="e.g. 1.00"
              />
              {errors.conversionRate && (
                <p className="text-red-500 text-sm">{errors.conversionRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Shipping Amount</label>
              <Input
                type="number"
                step="0.01"
                {...register("shippingAmount", {
                  required: "Shipping amount is required",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "Shipping amount cannot be negative"
                  }
                })}
                placeholder="e.g. 500.00"
              />
              {errors.shippingAmount && (
                <p className="text-red-500 text-sm">{errors.shippingAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Time Zone Offset (minutes)</label>
              <Input
                type="number"
                step="1"
                {...register("timeZoneOffsetMinutes", {
                  required: "Time zone offset is required",
                  valueAsNumber: true,
                  validate: (value) =>
                    Number.isInteger(value) || "Time zone offset must be an integer"
                })}
                placeholder="e.g. 300"
              />
              {errors.timeZoneOffsetMinutes && (
                <p className="text-red-500 text-sm">{errors.timeZoneOffsetMinutes.message}</p>
              )}
            </div>

            {currentRegion && (
              <div className="flex items-center justify-between">
                <label className="font-medium">Active</label>
                <Switch
                  checked={activeValue}
                  onCheckedChange={(checked) => setValue("active", checked)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpenForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {currentRegion ? (updateMutation.isPending ? "Updating..." : "Update") : createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
