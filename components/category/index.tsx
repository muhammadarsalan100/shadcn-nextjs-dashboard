"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateCategory, useUpdateCategory } from "@/lib/query/category.mutation";
import { useLanguages } from "@/lib/query/languages/languages.query";
import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { uploadCategoryImageToCloudinary } from "@/app/services/categories";
import type { CategoryDetails } from "@/app/services/categories";

type FormValues = {
  name: string;
  languageId: string;
};

interface AddCategoryFormProps {
  categoryToEdit?: CategoryDetails | null;
  onClose?: () => void;
}

// Max file size: 10MB (Cloudinary limit)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function AddCategoryForm({ categoryToEdit, onClose }: AddCategoryFormProps) {
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<FormValues>();
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { data: languages, isLoading: languagesLoading } = useLanguages();

  const selectedLanguageId = watch("languageId");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // If editing, populate form. Each field is set independently so a missing
  // or malformed piece (e.g. no language on the record) can't abort the rest.
  useEffect(() => {
    if (categoryToEdit) {
      setValue("name", categoryToEdit.name ?? "");
      setValue("languageId", categoryToEdit.language?.id != null ? String(categoryToEdit.language.id) : "");
      setImagePreview(categoryToEdit.imageUrl ?? null);
      setImageFile(null);
    } else {
      reset();
      setImagePreview(null);
      setImageFile(null);
    }
  }, [categoryToEdit, setValue, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`File is too large (${sizeMB}MB). Maximum size is 10MB.`);
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      let image: { url: string; publicId: string } | undefined;

      if (imageFile) {
        setIsUploadingImage(true);
        const uploaded = await uploadCategoryImageToCloudinary(imageFile);
        image = { url: uploaded.url, publicId: uploaded.publicId };
      }

      if (categoryToEdit?.id) {
        updateCategory(
          {
            id: categoryToEdit.id,
            data: {
              name: data.name,
              languageId: Number(data.languageId),
              ...(image ? { image } : {}),
            },
          },
          { onSuccess: () => onClose?.() }
        );
      } else {
        createCategory(
          {
            name: data.name,
            languageId: Number(data.languageId),
            ...(image ? { image } : {}),
          },
          {
            onSuccess: () => {
              reset();
              removeImage();
              onClose?.();
            },
          }
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category Image</label>
        <div className="flex items-start gap-4">
          {imagePreview ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Category preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 hover:border-amber-500 hover:bg-amber-500/5 transition-colors"
            >
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Upload</span>
            </button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

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

      <Button type="submit" disabled={isCreating || isUpdating || isUploadingImage || !selectedLanguageId}>
        {isUploadingImage
          ? "Uploading image..."
          : categoryToEdit
          ? isUpdating
            ? "Updating..."
            : "Update Category"
          : isCreating
          ? "Adding..."
          : "Add Category"}
      </Button>
    </form>
  );
}
