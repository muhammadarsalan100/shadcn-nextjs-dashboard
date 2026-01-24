"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Upload,
  X,
  ImagePlus,
  Package,
  Languages,
  Ruler,
  Sparkles,
  Loader2,
  Search,
  Filter,
  Pencil,
} from "lucide-react";
import { useLanguages } from "@/lib/query/languages/languages.query";
import { useCategories } from "@/lib/query/category.query";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/lib/query/products/products.mutation";
import { useProducts, useProduct } from "@/lib/query/products/products.query";
import { useCreateProductSize, useUpdateProductSize, useDeleteProductSize } from "@/lib/query/product-sizes/product-sizes.mutation";
import { useCreateProductTranslation, useUpdateProductTranslation, useDeleteProductTranslation } from "@/lib/query/product-translations/product-translations.mutation";
import {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  type ImageData,
  type ProductSize,
  type ProductTranslation,
  type CreateProductInput,
  type UpdateProductInput,
  type Product,
} from "@/app/services/products";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { productColumns } from "@/components/products/columns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormValues = {
  discountPercentage: number;
  perfumeType: "male" | "female" | "unisex";
  sizes: {
    size: string;
    stock: number;
    price: number;
  }[];
  translations: {
    languageId: string;
    categoryId: string;
    title: string;
    description: string;
  }[];
};

// Size form type
type SizeFormValues = {
  size: string;
  stock: number;
  price: number;
};

// Predefined size options
const SIZE_OPTIONS = ["30ml", "50ml", "75ml", "100ml", "150ml", "200ml", "250ml", "500ml"];

export default function ProductsPage() {
  const { data: languages } = useLanguages();
  const { data: categories } = useCategories();
  const { data: products, isLoading: productsLoading, isError: productsError } = useProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  
  // Size mutations
  const createSizeMutation = useCreateProductSize();
  const updateSizeMutation = useUpdateProductSize();
  const deleteSizeMutation = useDeleteProductSize();

  // Translation mutations
  const createTranslationMutation = useCreateProductTranslation();
  const updateTranslationMutation = useUpdateProductTranslation();
  const deleteTranslationMutation = useDeleteProductTranslation();

  const [openForm, setOpenForm] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Size management state
  const [openSizesDialog, setOpenSizesDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Edit dialog state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [editPerfumeType, setEditPerfumeType] = useState<"male" | "female" | "unisex">("unisex");
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editActive, setEditActive] = useState<boolean>(true);
  const [isEditUploading, setIsEditUploading] = useState(false);
  
  // Edit images state
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const [editImage1, setEditImage1] = useState<File | null>(null);
  const [editImage1Preview, setEditImage1Preview] = useState<string | null>(null);
  const [editImage2, setEditImage2] = useState<File | null>(null);
  const [editImage2Preview, setEditImage2Preview] = useState<string | null>(null);
  const [editImage3, setEditImage3] = useState<File | null>(null);
  const [editImage3Preview, setEditImage3Preview] = useState<string | null>(null);
  
  const editThumbnailRef = useRef<HTMLInputElement>(null);
  const editImage1Ref = useRef<HTMLInputElement>(null);
  const editImage2Ref = useRef<HTMLInputElement>(null);
  const editImage3Ref = useRef<HTMLInputElement>(null);


  // Add size state (for edit dialog)
  const [showAddSizeInEdit, setShowAddSizeInEdit] = useState(false);
  const [newEditSizeValue, setNewEditSizeValue] = useState("");
  const [newEditSizeStock, setNewEditSizeStock] = useState(0);
  const [newEditSizePrice, setNewEditSizePrice] = useState(0);

  // Edit size state
  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
  const [editSizeValue, setEditSizeValue] = useState("");
  const [editSizeStock, setEditSizeStock] = useState(0);
  const [editSizePrice, setEditSizePrice] = useState(0);

  // Edit translation state
  const [editingTranslationId, setEditingTranslationId] = useState<number | null>(null);
  const [editTranslationTitle, setEditTranslationTitle] = useState("");
  const [editTranslationDescription, setEditTranslationDescription] = useState("");
  const [editTranslationCategoryId, setEditTranslationCategoryId] = useState<number | null>(null);

  // Add translation state
  const [showAddTranslation, setShowAddTranslation] = useState(false);
  const [newTranslationLanguageId, setNewTranslationLanguageId] = useState<number | null>(null);
  const [newTranslationCategoryId, setNewTranslationCategoryId] = useState<number | null>(null);
  const [newTranslationTitle, setNewTranslationTitle] = useState("");
  const [newTranslationDescription, setNewTranslationDescription] = useState("");

  // Fetch product details when editing
  const { data: productDetails, isLoading: productDetailsLoading } = useProduct(editProductId);

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteId !== null) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setOpenDeleteDialog(false);
          toast.success("Product deleted successfully");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to delete product");
        },
      });
    }
  };

  // Size management handlers
  const handleManageSizesClick = (product: Product) => {
    setSelectedProduct(product);
    setOpenSizesDialog(true);
    sizeForm.reset({ size: "", stock: 0, price: 0 });
  };

  const handleAddSize = (data: SizeFormValues) => {
    if (!selectedProduct) return;

    // Validate size is selected
    if (!data.size || data.size.trim() === "") {
      toast.error("Please select a size");
      return;
    }

    createSizeMutation.mutate(
      {
        productId: selectedProduct.id,
        size: data.size,
        stock: Number(data.stock),
        price: Number(data.price),
      },
      {
        onSuccess: () => {
          toast.success("Size added successfully");
          sizeForm.reset({ size: "", stock: 0, price: 0 });
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add size");
        },
      }
    );
  };

  // Edit product handlers
  const handleEditClick = (product: Product) => {
    setEditProductId(product.id);
    setEditPerfumeType("unisex");
    setEditDiscount(Number(product.discountPercentage) || 0);
    setEditActive(product.active);
    // Reset image states
    setEditThumbnail(null);
    setEditThumbnailPreview(null);
    setEditImage1(null);
    setEditImage1Preview(null);
    setEditImage2(null);
    setEditImage2Preview(null);
    setEditImage3(null);
    setEditImage3Preview(null);
    setOpenEditDialog(true);
  };

  // Update edit form when product details are loaded
  useEffect(() => {
    if (productDetails && openEditDialog) {
      setEditPerfumeType(productDetails.perfumeType);
      setEditDiscount(Number(productDetails.discountPercentage) || 0);
      setEditActive(productDetails.active);
      setEditThumbnailPreview(productDetails.thumbnailUrl);
      setEditImage1Preview(productDetails.image1Url);
      setEditImage2Preview(productDetails.image2Url);
      setEditImage3Preview(productDetails.image3Url);
    }
  }, [productDetails, openEditDialog]);

  const handleEditImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        toast.error(`File is too large (${sizeMB}MB). Maximum size is 10MB.`);
        e.target.value = "";
        return;
      }
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async () => {
    if (!editProductId) return;

    setIsEditUploading(true);

    try {
      const updateData: UpdateProductInput = {
        perfumeType: editPerfumeType,
        discountPercentage: editDiscount,
        active: editActive,
      };

      // Upload new images if changed
      if (editThumbnail) {
        const data = await uploadToCloudinary(editThumbnail);
        updateData.thumbnailUrl = data.url;
        updateData.thumbnailPublicId = data.publicId;
      }
      if (editImage1) {
        const data = await uploadToCloudinary(editImage1);
        updateData.image1Url = data.url;
        updateData.image1PublicId = data.publicId;
      }
      if (editImage2) {
        const data = await uploadToCloudinary(editImage2);
        updateData.image2Url = data.url;
        updateData.image2PublicId = data.publicId;
      }
      if (editImage3) {
        const data = await uploadToCloudinary(editImage3);
        updateData.image3Url = data.url;
        updateData.image3PublicId = data.publicId;
      }

      await updateMutation.mutateAsync({
        id: editProductId,
        data: updateData,
      });

      toast.success("Product updated successfully!");
      setOpenEditDialog(false);
      setEditProductId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product");
    } finally {
      setIsEditUploading(false);
    }
  };


  const handleDeleteSize = (sizeId: number) => {
    deleteSizeMutation.mutate(sizeId, {
      onSuccess: () => {
        toast.success("Size deleted successfully");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to delete size");
      },
    });
  };

  const handleEditSizeClick = (size: { id: number; size: string; stock: number; price: string }) => {
    setEditingSizeId(size.id);
    setEditSizeValue(size.size);
    setEditSizeStock(size.stock);
    setEditSizePrice(Number(size.price));
  };

  const handleUpdateSize = () => {
    if (!editingSizeId) return;

    if (!editSizeValue || editSizeValue.trim() === "") {
      toast.error("Please select a size");
      return;
    }

    updateSizeMutation.mutate(
      {
        id: editingSizeId,
        data: {
          size: editSizeValue,
          stock: editSizeStock,
          price: editSizePrice,
        },
      },
      {
        onSuccess: () => {
          toast.success("Size updated successfully");
          setEditingSizeId(null);
          setEditSizeValue("");
          setEditSizeStock(0);
          setEditSizePrice(0);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update size");
        },
      }
    );
  };

  const handleCancelEditSize = () => {
    setEditingSizeId(null);
    setEditSizeValue("");
    setEditSizeStock(0);
    setEditSizePrice(0);
  };

  const handleAddSizeInEdit = () => {
    if (!editProductId || !newEditSizeValue) {
      toast.error("Please select a size");
      return;
    }

    createSizeMutation.mutate(
      {
        productId: editProductId,
        size: newEditSizeValue,
        stock: newEditSizeStock,
        price: newEditSizePrice,
      },
      {
        onSuccess: () => {
          toast.success("Size added successfully");
          setShowAddSizeInEdit(false);
          setNewEditSizeValue("");
          setNewEditSizeStock(0);
          setNewEditSizePrice(0);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add size");
        },
      }
    );
  };

  const handleRemoveImage = async (imageKey: "thumbnail" | "image1" | "image2" | "image3") => {
    if (!editProductId) return;
    
    const updateData: UpdateProductInput = {};
    
    if (imageKey === "thumbnail") {
      updateData.thumbnailUrl = null;
      updateData.thumbnailPublicId = null;
    } else if (imageKey === "image1") {
      updateData.image1Url = null;
      updateData.image1PublicId = null;
    } else if (imageKey === "image2") {
      updateData.image2Url = null;
      updateData.image2PublicId = null;
    } else if (imageKey === "image3") {
      updateData.image3Url = null;
      updateData.image3PublicId = null;
    }

    try {
      await updateMutation.mutateAsync({ id: editProductId, data: updateData });
      toast.success("Image removed successfully");
    } catch (error) {
      toast.error("Failed to remove image");
    }
  };

  // Translation handlers
  const handleEditTranslationClick = (translation: {
    id: number;
    title: string;
    description: string;
    category: { id: number; name: string };
  }) => {
    setEditingTranslationId(translation.id);
    setEditTranslationTitle(translation.title);
    setEditTranslationDescription(translation.description);
    setEditTranslationCategoryId(translation.category.id);
  };

  const handleUpdateTranslation = () => {
    if (!editingTranslationId) return;

    updateTranslationMutation.mutate(
      {
        id: editingTranslationId,
        data: {
          title: editTranslationTitle,
          description: editTranslationDescription,
          categoryId: editTranslationCategoryId || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Translation updated successfully");
          setEditingTranslationId(null);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update translation");
        },
      }
    );
  };

  const handleDeleteTranslation = (translationId: number) => {
    deleteTranslationMutation.mutate(translationId, {
      onSuccess: () => {
        toast.success("Translation deleted successfully");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to delete translation");
      },
    });
  };

  const handleAddTranslation = () => {
    if (!editProductId || !newTranslationLanguageId || !newTranslationCategoryId) {
      toast.error("Please fill all required fields");
      return;
    }

    createTranslationMutation.mutate(
      {
        productId: editProductId,
        languageId: newTranslationLanguageId,
        categoryId: newTranslationCategoryId,
        title: newTranslationTitle,
        description: newTranslationDescription,
      },
      {
        onSuccess: () => {
          toast.success("Translation added successfully");
          setShowAddTranslation(false);
          setNewTranslationLanguageId(null);
          setNewTranslationCategoryId(null);
          setNewTranslationTitle("");
          setNewTranslationDescription("");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add translation");
        },
      }
    );
  };

  const thumbnailRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      discountPercentage: 0,
      perfumeType: "unisex",
      sizes: [{ size: "", stock: 0, price: 0 }],
      translations: [{ languageId: "", categoryId: "", title: "", description: "" }],
    },
  });

  const {
    fields: sizeFields,
    append: appendSize,
    remove: removeSize,
  } = useFieldArray({
    control,
    name: "sizes",
  });

  const {
    fields: translationFields,
    append: appendTranslation,
    remove: removeTranslation,
  } = useFieldArray({
    control,
    name: "translations",
  });

  // Size form for managing product sizes
  const sizeForm = useForm<SizeFormValues>({
    defaultValues: {
      size: "",
      stock: 0,
      price: 0,
    },
  });

  // Max file size: 10MB (Cloudinary limit)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`File "${file.name}" is too large (${sizeMB}MB). Maximum size is 10MB.`);
      return false;
    }
    return true;
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFileSize(file)) {
        e.target.value = "";
        return;
      }
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 3 - images.length;
    
    // Filter out files that are too large
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        toast.error(`File "${file.name}" is too large (${sizeMB}MB). Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      setImages((prev) => [...prev, ...filesToAdd]);
      setImagePreviews((prev) => [
        ...prev,
        ...filesToAdd.map((f) => URL.createObjectURL(f)),
      ]);
    }
    
    // Reset input to allow re-selecting same files
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
    if (thumbnailRef.current) {
      thumbnailRef.current.value = "";
    }
  };

  const resetForm = () => {
    reset();
    setThumbnail(null);
    setThumbnailPreview(null);
    setImages([]);
    setImagePreviews([]);
  };

  const onSubmit = async (data: FormValues) => {
    // Validation
    if (!thumbnail) {
      toast.error("Thumbnail is required");
      return;
    }

    // Check for English translation (languageId 1 or code 'en')
    const englishLang = languages?.find((l) => l.code === "en");
    const hasEnglish = data.translations.some(
      (t) => Number(t.languageId) === englishLang?.id
    );

    if (!hasEnglish) {
      toast.error("English (en) translation is mandatory");
      return;
    }

    setIsUploading(true);

    try {
      // Upload thumbnail
      const thumbnailData = await uploadToCloudinary(thumbnail);

      // Upload additional images
      let imagesData: ImageData[] = [];
      if (images.length > 0) {
        imagesData = await uploadMultipleToCloudinary(images);
      }

      // Prepare product data
      const productData: CreateProductInput = {
        discountPercentage: data.discountPercentage || 0,
        perfumeType: data.perfumeType,
        thumbnail: thumbnailData,
        images: imagesData.length > 0 ? imagesData : undefined,
        sizes: data.sizes.map((s) => ({
          size: s.size || null,
          stock: Number(s.stock),
          price: Number(s.price),
        })),
        translations: data.translations.map((t) => ({
          languageId: Number(t.languageId),
          categoryId: Number(t.categoryId),
          title: t.title,
          description: t.description,
        })),
      };

      // Debug: Log the data being sent
      console.log("Creating product with data:", JSON.stringify(productData, null, 2));

      await createMutation.mutateAsync(productData);
      toast.success("Product created successfully!");
      setOpenForm(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setIsUploading(false);
    }
  };

  const perfumeType = watch("perfumeType");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
            Products
          </h2>
          <p className="text-muted-foreground">Manage your perfume catalog</p>
        </div>
        <Button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Search products..." className="pl-8" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {products?.length ?? 0} products in your catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={products}
            columns={productColumns(handleManageSizesClick, handleEditClick, handleDeleteClick)}
            isLoading={productsLoading}
            error={productsError}
            emptyMessage="No products found. Add your first product to get started."
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this product? This action cannot be undone.</p>
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

      {/* Edit Product Dialog */}
      <Dialog open={openEditDialog} onOpenChange={(open) => {
        setOpenEditDialog(open);
        if (!open) {
          setEditProductId(null);
          setEditThumbnail(null);
          setEditThumbnailPreview(null);
          setEditImage1(null);
          setEditImage1Preview(null);
          setEditImage2(null);
          setEditImage2Preview(null);
          setEditImage3(null);
          setEditImage3Preview(null);
          // Reset add size form
          setShowAddSizeInEdit(false);
          setNewEditSizeValue("");
          setNewEditSizeStock(0);
          setNewEditSizePrice(0);
          // Reset translation state
          setEditingTranslationId(null);
          setShowAddTranslation(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-500" />
              Edit Product {productDetails ? `- ${productDetails.translations[0]?.title || ""}` : ""}
            </DialogTitle>
          </DialogHeader>

          {productDetailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : productDetails ? (
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="sizes">Sizes ({productDetails.sizes.length})</TabsTrigger>
                <TabsTrigger value="translations">Translations ({productDetails.translations.length})</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Perfume Type</label>
                    <Select
                      value={editPerfumeType}
                      onValueChange={(value) => setEditPerfumeType(value as "male" | "female" | "unisex")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Active Status</Label>
                    <p className="text-xs text-muted-foreground">
                      {editActive ? "Product is visible to customers" : "Product is hidden from customers"}
                    </p>
                  </div>
                  <Switch
                    checked={editActive}
                    onCheckedChange={setEditActive}
                  />
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={isEditUploading || updateMutation.isPending}
                    className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
                  >
                    {isEditUploading || updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Thumbnail */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        Thumbnail
                        {editThumbnailPreview && (
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {/* Show new preview if selected */}
                        {editThumbnailPreview ? (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-amber-400">
                            <img
                              src={editThumbnailPreview}
                              alt="New Thumbnail Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditThumbnail(null);
                                setEditThumbnailPreview(null);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-full hover:bg-gray-800 transition-colors"
                              title="Cancel selection"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-xs py-1 text-center">
                              Preview - Click Save to upload
                            </div>
                          </div>
                        ) : productDetails.thumbnailUrl ? (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={productDetails.thumbnailUrl}
                              alt="Current Thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage("thumbnail")}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => editThumbnailRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {editThumbnailPreview ? "Choose Different" : productDetails.thumbnailUrl ? "Change" : "Upload"}
                        </Button>
                        <input
                          ref={editThumbnailRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditImageChange(e, setEditThumbnail, setEditThumbnailPreview)}
                          className="hidden"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Image 1 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        Image 1
                        {editImage1Preview && (
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {/* Show new preview if selected */}
                        {editImage1Preview ? (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-amber-400">
                            <img
                              src={editImage1Preview}
                              alt="New Image 1 Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditImage1(null);
                                setEditImage1Preview(null);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-full hover:bg-gray-800 transition-colors"
                              title="Cancel selection"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-xs py-1 text-center">
                              Preview - Click Save to upload
                            </div>
                          </div>
                        ) : productDetails.image1Url ? (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={productDetails.image1Url}
                              alt="Current Image 1"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage("image1")}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <ImagePlus className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => editImage1Ref.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {editImage1Preview ? "Choose Different" : productDetails.image1Url ? "Change" : "Upload"}
                        </Button>
                        <input
                          ref={editImage1Ref}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditImageChange(e, setEditImage1, setEditImage1Preview)}
                          className="hidden"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Image 2 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        Image 2
                        {editImage2Preview && (
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {/* Show new preview if selected */}
                        {editImage2Preview ? (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-amber-400">
                            <img
                              src={editImage2Preview}
                              alt="New Image 2 Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditImage2(null);
                                setEditImage2Preview(null);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-full hover:bg-gray-800 transition-colors"
                              title="Cancel selection"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-xs py-1 text-center">
                              Preview - Click Save to upload
                            </div>
                          </div>
                        ) : productDetails.image2Url ? (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={productDetails.image2Url}
                              alt="Current Image 2"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage("image2")}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <ImagePlus className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => editImage2Ref.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {editImage2Preview ? "Choose Different" : productDetails.image2Url ? "Change" : "Upload"}
                        </Button>
                        <input
                          ref={editImage2Ref}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditImageChange(e, setEditImage2, setEditImage2Preview)}
                          className="hidden"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Image 3 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        Image 3
                        {editImage3Preview && (
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {/* Show new preview if selected */}
                        {editImage3Preview ? (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-amber-400">
                            <img
                              src={editImage3Preview}
                              alt="New Image 3 Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditImage3(null);
                                setEditImage3Preview(null);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-full hover:bg-gray-800 transition-colors"
                              title="Cancel selection"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-xs py-1 text-center">
                              Preview - Click Save to upload
                            </div>
                          </div>
                        ) : productDetails.image3Url ? (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={productDetails.image3Url}
                              alt="Current Image 3"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage("image3")}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <ImagePlus className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => editImage3Ref.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {editImage3Preview ? "Choose Different" : productDetails.image3Url ? "Change" : "Upload"}
                        </Button>
                        <input
                          ref={editImage3Ref}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditImageChange(e, setEditImage3, setEditImage3Preview)}
                          className="hidden"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    onClick={handleEditSubmit}
                    disabled={isEditUploading || updateMutation.isPending}
                    className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
                  >
                    {isEditUploading || updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Save Images"
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>

              {/* Sizes Tab */}
              <TabsContent value="sizes" className="mt-4">
                <div className="space-y-4">
                  {/* Add Size Button */}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => setShowAddSizeInEdit(!showAddSizeInEdit)}
                      className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Size
                    </Button>
                  </div>

                  {/* Add Size Form */}
                  {showAddSizeInEdit && (
                    <Card className="border-amber-500/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">New Size</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Size *</label>
                            <Select value={newEditSizeValue} onValueChange={setNewEditSizeValue}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                {SIZE_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Stock *</label>
                            <Input
                              type="number"
                              min="0"
                              value={newEditSizeStock}
                              onChange={(e) => setNewEditSizeStock(Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Price ($) *</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={newEditSizePrice}
                              onChange={(e) => setNewEditSizePrice(Number(e.target.value))}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddSizeInEdit(false);
                              setNewEditSizeValue("");
                              setNewEditSizeStock(0);
                              setNewEditSizePrice(0);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddSizeInEdit}
                            disabled={createSizeMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {createSizeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Sizes Table */}
                  <Card>
                    <CardContent className="pt-4">
                      {productDetails.sizes.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Size</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productDetails.sizes.map((size) => (
                              <TableRow key={size.id}>
                                {editingSizeId === size.id ? (
                                  <>
                                    <TableCell>
                                      <Select
                                        value={editSizeValue}
                                        onValueChange={setEditSizeValue}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {SIZE_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={option}>
                                              {option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={editSizeStock}
                                        onChange={(e) => setEditSizeStock(Number(e.target.value))}
                                        className="w-20"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editSizePrice}
                                        onChange={(e) => setEditSizePrice(Number(e.target.value))}
                                        className="w-24"
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleUpdateSize}
                                          disabled={updateSizeMutation.isPending}
                                        >
                                          {updateSizeMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            "Save"
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={handleCancelEditSize}
                                          disabled={updateSizeMutation.isPending}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell className="font-medium">{size.size}</TableCell>
                                    <TableCell>
                                      <Badge variant={size.stock > 0 ? "default" : "destructive"}>
                                        {size.stock}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-amber-600 font-semibold">${size.price}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditSizeClick(size)}
                                          title="Edit Size"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleDeleteSize(size.id)}
                                          disabled={deleteSizeMutation.isPending}
                                          title="Delete Size"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No sizes added yet. Click "Add Size" above to add one.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Translations Tab */}
              <TabsContent value="translations" className="mt-4">
                <div className="space-y-4">
                  {/* Add Translation Button */}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => setShowAddTranslation(!showAddTranslation)}
                      className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Translation
                    </Button>
                  </div>

                  {/* Add Translation Form */}
                  {showAddTranslation && (
                    <Card className="border-amber-500/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">New Translation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Language *</label>
                            <Select
                              value={newTranslationLanguageId?.toString() || ""}
                              onValueChange={(v) => setNewTranslationLanguageId(Number(v))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                {languages?.filter(lang => 
                                  !productDetails.translations.some(t => t.language.id === lang.id)
                                ).map((lang) => (
                                  <SelectItem key={lang.id} value={String(lang.id)}>
                                    {lang.name} ({lang.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Category *</label>
                            <Select
                              value={newTranslationCategoryId?.toString() || ""}
                              onValueChange={(v) => setNewTranslationCategoryId(Number(v))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map((cat) => (
                                  <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Title *</label>
                          <Input
                            value={newTranslationTitle}
                            onChange={(e) => setNewTranslationTitle(e.target.value)}
                            placeholder="Product title"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Description *</label>
                          <Textarea
                            value={newTranslationDescription}
                            onChange={(e) => setNewTranslationDescription(e.target.value)}
                            placeholder="Product description"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddTranslation(false);
                              setNewTranslationLanguageId(null);
                              setNewTranslationCategoryId(null);
                              setNewTranslationTitle("");
                              setNewTranslationDescription("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddTranslation}
                            disabled={createTranslationMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {createTranslationMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Existing Translations */}
                  {productDetails.translations.map((translation) => (
                    <Card key={translation.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Languages className="h-4 w-4" />
                            {translation.language.name} ({translation.language.code})
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {editingTranslationId !== translation.id && (
                              <>
                                <Badge variant="secondary">{translation.category.name}</Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditTranslationClick(translation)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteTranslation(translation.id)}
                                  disabled={deleteTranslationMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {editingTranslationId === translation.id ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Category</label>
                              <Select
                                value={editTranslationCategoryId?.toString() || ""}
                                onValueChange={(v) => setEditTranslationCategoryId(Number(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories?.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Title</label>
                              <Input
                                value={editTranslationTitle}
                                onChange={(e) => setEditTranslationTitle(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Description</label>
                              <Textarea
                                value={editTranslationDescription}
                                onChange={(e) => setEditTranslationDescription(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTranslationId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleUpdateTranslation}
                                disabled={updateTranslationMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {updateTranslationMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Title</label>
                              <p className="font-medium">{translation.title}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Description</label>
                              <p className="text-sm text-muted-foreground">{translation.description}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {productDetails.translations.length === 0 && !showAddTranslation && (
                    <p className="text-center text-muted-foreground py-8">
                      No translations found. Click "Add Translation" to add one.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Failed to load product details.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Size Dialog */}
      <Dialog open={openSizesDialog} onOpenChange={(open) => {
        setOpenSizesDialog(open);
        if (!open) {
          sizeForm.reset({ size: "", stock: 0, price: 0 });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-amber-500" />
              Add Size - {selectedProduct?.title}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={sizeForm.handleSubmit(handleAddSize)}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Size *</label>
                <Select
                  value={sizeForm.watch("size")}
                  onValueChange={(value) => sizeForm.setValue("size", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Stock *</label>
                <Input
                  type="number"
                  min="0"
                  {...sizeForm.register("stock", { required: true, valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Price ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...sizeForm.register("price", { required: true, valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenSizesDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSizeMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
              >
                {createSizeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Plus className="h-4 w-4 mr-1" /> Add Size</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* Add Product Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Create New Product
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-4">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Perfume Type *</label>
                    <Select
                      value={perfumeType}
                      onValueChange={(value) =>
                        setValue("perfumeType", value as "male" | "female" | "unisex")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register("discountPercentage", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Product Images
                </CardTitle>
                <CardDescription>Upload thumbnail (required) and up to 3 additional images</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Thumbnail */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thumbnail *</label>
                  <div className="flex items-start gap-4">
                    {thumbnailPreview ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeThumbnail}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => thumbnailRef.current?.click()}
                        className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:border-amber-500 hover:bg-amber-500/5 transition-colors"
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </button>
                    )}
                    <input
                      ref={thumbnailRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Additional Images */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Images (max 3)</label>
                  <div className="flex items-start gap-4 flex-wrap">
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative w-24 h-24 rounded-lg overflow-hidden border"
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <button
                        type="button"
                        onClick={() => imagesRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 hover:border-amber-500 hover:bg-amber-500/5 transition-colors"
                      >
                        <Plus className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add</span>
                      </button>
                    )}
                    <input
                      ref={imagesRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sizes */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Product Sizes
                    </CardTitle>
                    <CardDescription>Add at least one size variant</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendSize({ size: "", stock: 0, price: 0 })}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Size
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sizeFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-4 gap-3 items-end p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Size *</label>
                      <Select
                        value={watch(`sizes.${index}.size`)}
                        onValueChange={(value) => setValue(`sizes.${index}.size`, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Stock *</label>
                      <Input
                        type="number"
                        min="0"
                        {...register(`sizes.${index}.stock`, {
                          required: true,
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Price ($) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`sizes.${index}.price`, {
                          required: true,
                          valueAsNumber: true,
                        })}
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => sizeFields.length > 1 && removeSize(index)}
                      disabled={sizeFields.length === 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Translations */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Translations
                    </CardTitle>
                    <CardDescription>
                      Add product details in multiple languages. English (en) is required.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendTranslation({
                        languageId: "",
                        categoryId: "",
                        title: "",
                        description: "",
                      })
                    }
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Translation
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {translationFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 border rounded-lg space-y-4 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Translation #{index + 1}
                      </span>
                      {translationFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTranslation(index)}
                          className="text-destructive hover:text-destructive h-8"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Language *</label>
                        <Select
                          value={watch(`translations.${index}.languageId`)}
                          onValueChange={(value) =>
                            setValue(`translations.${index}.languageId`, value)
                          }
                        >
                          <SelectTrigger className="w-full">
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
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium">Category *</label>
                        <Select
                          value={watch(`translations.${index}.categoryId`)}
                          onValueChange={(value) =>
                            setValue(`translations.${index}.categoryId`, value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Title *</label>
                      <Input
                        {...register(`translations.${index}.title`, { required: true })}
                        placeholder="Product title"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Description *</label>
                      <Textarea
                        {...register(`translations.${index}.description`, {
                          required: true,
                        })}
                        placeholder="Product description"
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Footer */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || createMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
              >
                {isUploading || createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploading ? "Uploading images..." : "Creating..."}
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
