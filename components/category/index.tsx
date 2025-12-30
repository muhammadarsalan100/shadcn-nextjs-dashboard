"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateCategory, useUpdateCategory } from "@/lib/query/category.mutation";
import { useEffect } from "react";

type FormValues = { category: string };

interface AddCategoryFormProps {
  categoryToEdit?: { id: number; name: string };
  onClose?: () => void; // for closing dialog if used
}

export function AddCategoryForm({ categoryToEdit, onClose }: AddCategoryFormProps) {
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<FormValues>();
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  // If editing, populate form
  useEffect(() => {
    if (categoryToEdit) {
      setValue("category", categoryToEdit.name);
    } else {
      reset();
    }
  }, [categoryToEdit, setValue, reset]);

  const onSubmit = (data: FormValues) => {
    if (categoryToEdit?.id) {
      updateCategory({ id: categoryToEdit.id, name: data.category }, {
        onSuccess: () => onClose?.(),
      });
    } else {
      createCategory(data.category, {
        onSuccess: () => {
          reset();
          onClose?.();
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 max-w-md">
      <div>
        <Input
          placeholder="Category name"
          {...register("category", { required: "Category is required" })}
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isCreating || isUpdating}>
        {categoryToEdit ? (isUpdating ? "Updating..." : "Update Category") : (isCreating ? "Adding..." : "Add Category")}
      </Button>
    </form>
  );
}
