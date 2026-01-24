"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateCategory, useUpdateCategory } from "@/lib/query/category.mutation";
import { useLanguages } from "@/lib/query/languages/languages.query";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/app/services/categories";

type FormValues = { 
  name: string;
  languageId: string;
};

interface AddCategoryFormProps {
  categoryToEdit?: Category;
  onClose?: () => void;
}

export function AddCategoryForm({ categoryToEdit, onClose }: AddCategoryFormProps) {
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<FormValues>();
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { data: languages, isLoading: languagesLoading } = useLanguages();

  const selectedLanguageId = watch("languageId");

  // If editing, populate form
  useEffect(() => {
    if (categoryToEdit) {
      setValue("name", categoryToEdit.name);
      setValue("languageId", String(categoryToEdit.language.id));
    } else {
      reset();
    }
  }, [categoryToEdit, setValue, reset]);

  const onSubmit = (data: FormValues) => {
    if (categoryToEdit?.id) {
      updateCategory({ 
        id: categoryToEdit.id, 
        data: { 
          name: data.name, 
          languageId: Number(data.languageId) 
        } 
      }, {
        onSuccess: () => onClose?.(),
      });
    } else {
      createCategory({ 
        name: data.name, 
        languageId: Number(data.languageId) 
      }, {
        onSuccess: () => {
          reset();
          onClose?.();
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div>
        <Input
          placeholder="Category name"
          {...register("name", { required: "Category name is required" })}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <Select
          value={selectedLanguageId}
          onValueChange={(value) => setValue("languageId", value)}
          disabled={languagesLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages?.map((lang) => (
              <SelectItem key={lang.id} value={String(lang.id)}>
                {lang.name} ({lang.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.languageId && (
          <p className="mt-1 text-sm text-red-500">{errors.languageId.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isCreating || isUpdating || !selectedLanguageId}>
        {categoryToEdit ? (isUpdating ? "Updating..." : "Update Category") : (isCreating ? "Adding..." : "Add Category")}
      </Button>
    </form>
  );
}
