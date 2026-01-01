"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRegions } from "@/lib/query/region/region.mutation";
import { useCreateRegion, useDeleteRegion, useUpdateRegion } from "@/lib/query/region/region.query";
import { Region } from "@/app/services/region";
import { DataTable } from "@/components/shared/data-table";
import { regionColumns } from "@/components/regions/columns";

type RegionFormValues = {
  name: string;
  pricePercentage: number;
};

export default function RegionsPage() {
  const { data: regions, isLoading, isError } = useRegions();
  const deleteMutation = useDeleteRegion();
  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();

  const [openForm, setOpenForm] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegionFormValues>({
    defaultValues: { name: "", pricePercentage: 0 },
  });

  const handleEditClick = (region: Region) => {
    setCurrentRegion(region);
    reset({ name: region.name, pricePercentage: region.pricePercentage });
    setOpenForm(true);
  };

  const handleAddClick = () => {
    setCurrentRegion(null);
    reset({ name: "", pricePercentage: 0 });
    setOpenForm(true);
  };

  const onSubmit = (data: RegionFormValues) => {
    if (currentRegion) {
      // Update
      updateMutation.mutate(
        { id: currentRegion.id, data },
        { onSuccess: () => setOpenForm(false) }
      );
    } else {
      // Create
      createMutation.mutate(data, { onSuccess: () => setOpenForm(false) });
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
            columns={regionColumns(deleteMutation, handleEditClick)}
            isLoading={isLoading}
            error={isError}
            emptyMessage="No regions found"
          />
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentRegion ? "Edit Region" : "Add Region"}</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="block font-medium">Region Name</label>
              <Input
                {...register("name", { required: "Region name is required" })}
                placeholder="Region Name"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Price Percentage</label>
              <Input
                type="number"
                step="0.01"
                {...register("pricePercentage", { required: "Price percentage is required" })}
                placeholder="Price Percentage"
              />
              {errors.pricePercentage && (
                <p className="text-red-500 text-sm">{errors.pricePercentage.message}</p>
              )}
            </div>

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
