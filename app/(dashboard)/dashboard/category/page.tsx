"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Filter, Trash, Edit, ImageOff, Loader2 } from "lucide-react";
import { useCategories, useCategoryById } from "@/lib/query/category.query";
import { useDeleteCategory } from "@/lib/query/category.mutation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddCategoryForm } from "@/components/category";
import type { Category } from "@/app/services/categories";
import { Pagination, DEFAULT_PAGE_SIZE } from "@/components/shared/pagination";

export default function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();
  const deleteMutation = useDeleteCategory();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Fetch the full admin record (includes the Cloudinary public ID) when editing
  const { data: categoryDetails, isLoading: categoryDetailsLoading } = useCategoryById(editCategoryId);

  const totalPages = Math.max(1, Math.ceil((categories?.length ?? 0) / pageSize));
  const paginatedCategories = categories?.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  // Delete handlers
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

  // Edit handler
  const handleEditClick = (cat: Category) => {
    setEditCategoryId(cat.id);
    setOpenForm(true);
  };

  // Add handler
  const handleAddClick = () => {
    setEditCategoryId(null);
    setOpenForm(true);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Manage all categories.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleAddClick}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Search categories..." className="pl-8" />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Image</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Language</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-red-500">
                    Failed to load categories
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                !isError &&
                paginatedCategories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-pink-100 dark:from-amber-900/20 dark:to-pink-900/20 flex items-center justify-center">
                        {cat.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageOff className="h-4 w-4 text-amber-500/50" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>
                      {cat.language?.name} ({cat.language?.code})
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(cat)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteClick(cat.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalResults={categories?.length}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open);
          if (!open) setEditCategoryId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCategoryId ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          {editCategoryId && categoryDetailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : (
            <AddCategoryForm
              categoryToEdit={editCategoryId ? categoryDetails : null}
              onClose={() => setOpenForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this category?</p>
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
