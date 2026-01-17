"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguages } from "@/lib/query/languages/languages.query";
import { useCreateLanguage, useDeleteLanguage, useUpdateLanguage } from "@/lib/query/languages/languages.mutation";
import { Language } from "@/app/services/languages";
import { DataTable } from "@/components/shared/data-table";
import { languageColumns } from "@/components/languages/columns";

type CreateFormValues = {
  code: string;
  name: string;
};

type EditFormValues = {
  name: string;
};

export default function LanguagesPage() {
  const { data: languages, isLoading, isError } = useLanguages();
  const deleteMutation = useDeleteLanguage();
  const createMutation = useCreateLanguage();
  const updateMutation = useUpdateLanguage();

  const [openForm, setOpenForm] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const createForm = useForm<CreateFormValues>({
    defaultValues: { code: "", name: "" },
  });

  const editForm = useForm<EditFormValues>({
    defaultValues: { name: "" },
  });

  const handleEditClick = (language: Language) => {
    setCurrentLanguage(language);
    editForm.reset({ name: language.name });
    setOpenForm(true);
  };

  const handleAddClick = () => {
    setCurrentLanguage(null);
    createForm.reset({ code: "", name: "" });
    setOpenForm(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteId !== null) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setOpenDeleteDialog(false),
      });
    }
  };

  const onCreateSubmit = (data: CreateFormValues) => {
    createMutation.mutate(data, { onSuccess: () => setOpenForm(false) });
  };

  const onEditSubmit = (data: EditFormValues) => {
    if (currentLanguage) {
      updateMutation.mutate(
        { id: currentLanguage.id, name: data.name },
        { onSuccess: () => setOpenForm(false) }
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Languages</h2>
          <p className="text-muted-foreground">Manage all languages.</p>
        </div>
        <Button onClick={handleAddClick} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Language
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Search languages..." className="pl-8" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </CardContent>
      </Card>

      {/* Languages Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={languages}
            columns={languageColumns(handleEditClick, handleDeleteClick)}
            isLoading={isLoading}
            error={isError}
            emptyMessage="No languages found"
          />
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentLanguage ? "Edit Language" : "Add Language"}</DialogTitle>
          </DialogHeader>

          {/* Create Form */}
          {!currentLanguage && (
            <form className="space-y-4 mt-4" onSubmit={createForm.handleSubmit(onCreateSubmit)}>
              <div className="space-y-2">
                <label className="block font-medium">Language Code</label>
                <Input
                  {...createForm.register("code", { required: "Language code is required" })}
                  placeholder="e.g. en, ur, fr"
                />
                {createForm.formState.errors.code && (
                  <p className="text-red-500 text-sm">{createForm.formState.errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Language Name</label>
                <Input
                  {...createForm.register("name", { required: "Language name is required" })}
                  placeholder="e.g. English, Urdu, French"
                />
                {createForm.formState.errors.name && (
                  <p className="text-red-500 text-sm">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setOpenForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          )}

          {/* Edit Form */}
          {currentLanguage && (
            <form className="space-y-4 mt-4" onSubmit={editForm.handleSubmit(onEditSubmit)}>
              <div className="space-y-2">
                <label className="block font-medium">Language Code</label>
                <Input value={currentLanguage.code} disabled className="bg-muted" />
                <p className="text-muted-foreground text-sm">Code cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label className="block font-medium">Language Name</label>
                <Input
                  {...editForm.register("name", { required: "Language name is required" })}
                  placeholder="e.g. English, Urdu, French"
                />
                {editForm.formState.errors.name && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setOpenForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this language?</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
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
    </div>
  );
}
