"use client";

import { useState, useRef, useEffect, useMemo, Fragment } from "react";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
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
  Globe,
  MapPin,
  ChevronDown,
  Percent,
  Gift,
  Truck,
  Check,
  ImageIcon,
} from "lucide-react";
import { useLanguages } from "@/lib/query/languages/languages.query";
import { useCategories } from "@/lib/query/category.query";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/lib/query/products/products.mutation";
import { useProducts, useProduct } from "@/lib/query/products/products.query";
import { useCreateProductSize, useUpdateProductSize, useDeleteProductSize } from "@/lib/query/product-sizes/product-sizes.mutation";
import { useCreateProductTranslation, useUpdateProductTranslation, useDeleteProductTranslation } from "@/lib/query/product-translations/product-translations.mutation";
import { useRegions } from "@/lib/query/region/region.query";
import { useProductRegionPrices } from "@/lib/query/product-region-prices/product-region-prices.query";
import {
  useCreateProductRegionPrice,
  useUpdateProductRegionPrice,
  useDeleteProductRegionPrice,
} from "@/lib/query/product-region-prices/product-region-prices.mutation";
import { useProductRegionDiscounts } from "@/lib/query/product-region-discounts/product-region-discounts.query";
import {
  useCreateProductRegionDiscount,
  useUpdateProductRegionDiscount,
  useDeleteProductRegionDiscount,
} from "@/lib/query/product-region-discounts/product-region-discounts.mutation";
import { useProductRegionPromotions } from "@/lib/query/product-region-promotions/product-region-promotions.query";
import {
  useCreateProductRegionPromotion,
  useUpdateProductRegionPromotion,
  useDeleteProductRegionPromotion,
} from "@/lib/query/product-region-promotions/product-region-promotions.mutation";
import {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  type ImageData,
  type CreateProductInput,
  type UpdateProductInput,
  type Product,
} from "@/app/services/products";
import type { ProductRegionPrice } from "@/app/services/product-region-prices";
import type { ProductRegionDiscount } from "@/app/services/product-region-discounts";
import type { ProductRegionPromotion } from "@/app/services/product-region-promotions";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { Pagination, DEFAULT_PAGE_SIZE } from "@/components/shared/pagination";
import { productColumns } from "@/components/products/columns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type FormValues = {
  perfumeType: "male" | "female" | "unisex" | "";
  sortOrder: number;
  translations: {
    languageId: string;
    categoryId: string;
    title: string;
    description: string;
  }[];
};

// A regional price being drafted for a size on the create-product form
type DraftRegionalPrice = {
  key: string;
  regionId: string;
  price: string;
};

// A size being drafted on the create-product form, together with its
// per-region prices. Kept as plain state (rather than a nested react-hook-form
// field array) since the regional prices list needs its own add/remove UI.
type DraftSize = {
  key: string;
  size: string;
  stock: number;
  regionalPrices: DraftRegionalPrice[];
  pendingRegionId: string;
  pendingPrice: string;
};

// A regional discount being drafted on the create-product form
type DraftDiscount = {
  key: string;
  regionId: string;
  discountPercentage: string;
  startDateTime: string;
  endDateTime: string;
  active: boolean;
};

// A promotion (free shipping / welcome offer) being drafted on the create-product form
type DraftPromotion = {
  key: string;
  regionId: string;
  freeShipping: boolean;
  welcomeOfferActive: boolean;
  welcomeDiscountPercentage: string;
  welcomeOfferStartAt: string;
  welcomeOfferEndAt: string;
};

// Predefined size options
const SIZE_OPTIONS = ["30ml", "50ml", "75ml", "100ml", "150ml", "200ml", "250ml", "500ml"];

// Steps for the create-product wizard, in order. Sizes and Offers are
// optional — Next just moves on, nothing there blocks progress.
const CREATE_STEPS = [
  { id: "basic", label: "Basic Info", icon: Package, optional: false },
  { id: "images", label: "Images", icon: ImagePlus, optional: false },
  { id: "sizes", label: "Sizes & Price", icon: Ruler, optional: true },
  { id: "offers", label: "Offers", icon: Percent, optional: true },
  { id: "translations", label: "Translations", icon: Languages, optional: false },
] as const;
const CREATE_TAB_ORDER: string[] = CREATE_STEPS.map((s) => s.id);

// Converts an ISO datetime string to the "YYYY-MM-DDTHH:mm" format required by <input type="datetime-local">
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ProductsPage() {
  const { data: languages } = useLanguages();
  const { data: categories } = useCategories();
  const { data: products, isLoading: productsLoading, isError: productsError } = useProducts();
  const { data: regions } = useRegions();
  const activeRegions = useMemo(() => (regions ?? []).filter((r) => r.active), [regions]);

  const [productsPage, setProductsPage] = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(DEFAULT_PAGE_SIZE);
  const productsTotalPages = Math.max(
    1,
    Math.ceil((products?.length ?? 0) / productsPageSize)
  );
  const paginatedProducts = products?.slice(
    (productsPage - 1) * productsPageSize,
    productsPage * productsPageSize
  );
  const handleProductsPageSizeChange = (size: number) => {
    setProductsPageSize(size);
    setProductsPage(1);
  };
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
  const [createActiveTab, setCreateActiveTab] = useState("basic");
  const createTabIndex = CREATE_TAB_ORDER.indexOf(createActiveTab);
  const isFirstCreateTab = createTabIndex === 0;
  const isLastCreateTab = createTabIndex === CREATE_TAB_ORDER.length - 1;
  const goToPrevCreateTab = () => {
    if (createTabIndex > 0) setCreateActiveTab(CREATE_TAB_ORDER[createTabIndex - 1]);
  };
  const goToNextCreateTab = () => {
    if (createTabIndex < CREATE_TAB_ORDER.length - 1) setCreateActiveTab(CREATE_TAB_ORDER[createTabIndex + 1]);
  };
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<number | null>(null);
  const [translationToDelete, setTranslationToDelete] = useState<number | null>(null);
  const [priceToDelete, setPriceToDelete] = useState<number | null>(null);

  // Edit dialog state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editActiveTab, setEditActiveTab] = useState("basic");
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [editPerfumeType, setEditPerfumeType] = useState<"male" | "female" | "unisex" | null>(null);
  const [editSortOrder, setEditSortOrder] = useState<number>(0);
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

  // Edit size state
  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);
  const [editSizeValue, setEditSizeValue] = useState("");
  const [editSizeStock, setEditSizeStock] = useState(0);

  // Which size cards are expanded to show their regional prices (edit dialog)
  const [expandedSizeIds, setExpandedSizeIds] = useState<Set<number>>(new Set());
  const toggleSizeExpanded = (id: number) => {
    setExpandedSizeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Regional price management (edit dialog)
  const [addingPriceForSizeId, setAddingPriceForSizeId] = useState<number | null>(null);
  const [newPriceRegionId, setNewPriceRegionId] = useState("");
  const [newPriceValue, setNewPriceValue] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editPriceActive, setEditPriceActive] = useState(true);

  // Regional discount management (edit dialog)
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newDiscountRegionId, setNewDiscountRegionId] = useState("");
  const [newDiscountPercentage, setNewDiscountPercentage] = useState("");
  const [newDiscountStart, setNewDiscountStart] = useState("");
  const [newDiscountEnd, setNewDiscountEnd] = useState("");
  const [newDiscountActive, setNewDiscountActive] = useState(true);
  const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);
  const [editDiscountPercentage, setEditDiscountPercentage] = useState("");
  const [editDiscountStart, setEditDiscountStart] = useState("");
  const [editDiscountEnd, setEditDiscountEnd] = useState("");
  const [editDiscountActive, setEditDiscountActive] = useState(true);
  const [discountToDelete, setDiscountToDelete] = useState<number | null>(null);

  // Regional promotion management (edit dialog)
  const [showAddPromotion, setShowAddPromotion] = useState(false);
  const [newPromotionRegionId, setNewPromotionRegionId] = useState("");
  const [newPromotionFreeShipping, setNewPromotionFreeShipping] = useState(false);
  const [newPromotionWelcomeActive, setNewPromotionWelcomeActive] = useState(false);
  const [newPromotionWelcomePercentage, setNewPromotionWelcomePercentage] = useState("");
  const [newPromotionWelcomeStart, setNewPromotionWelcomeStart] = useState("");
  const [newPromotionWelcomeEnd, setNewPromotionWelcomeEnd] = useState("");
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [editPromotionFreeShipping, setEditPromotionFreeShipping] = useState(false);
  const [editPromotionWelcomeActive, setEditPromotionWelcomeActive] = useState(false);
  const [editPromotionWelcomePercentage, setEditPromotionWelcomePercentage] = useState("");
  const [editPromotionWelcomeStart, setEditPromotionWelcomeStart] = useState("");
  const [editPromotionWelcomeEnd, setEditPromotionWelcomeEnd] = useState("");
  const [promotionToDelete, setPromotionToDelete] = useState<number | null>(null);

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

  // Fetch every regional price configured for the product being edited, grouped by size
  const { data: regionPrices } = useProductRegionPrices(editProductId);
  const pricesBySizeId = useMemo(() => {
    const map = new Map<number, ProductRegionPrice[]>();
    (regionPrices ?? []).forEach((rp) => {
      const list = map.get(rp.productSize.id) ?? [];
      list.push(rp);
      map.set(rp.productSize.id, list);
    });
    return map;
  }, [regionPrices]);

  const createRegionPriceMutation = useCreateProductRegionPrice();
  const updateRegionPriceMutation = useUpdateProductRegionPrice();
  const deleteRegionPriceMutation = useDeleteProductRegionPrice();

  // Fetch every regional discount configured for the product being edited
  const { data: regionDiscountsResponse } = useProductRegionDiscounts(editProductId);
  const regionDiscounts = regionDiscountsResponse?.data ?? [];

  const createRegionDiscountMutation = useCreateProductRegionDiscount();
  const updateRegionDiscountMutation = useUpdateProductRegionDiscount();
  const deleteRegionDiscountMutation = useDeleteProductRegionDiscount();

  // Fetch every regional promotion configured for the product being edited
  const { data: regionPromotionsResponse } = useProductRegionPromotions(editProductId);
  const regionPromotions = regionPromotionsResponse?.data ?? [];

  const createRegionPromotionMutation = useCreateProductRegionPromotion();
  const updateRegionPromotionMutation = useUpdateProductRegionPromotion();
  const deleteRegionPromotionMutation = useDeleteProductRegionPromotion();

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

  // Edit product handlers
  const handleEditClick = (product: Product) => {
    setEditProductId(product.id);
    setEditPerfumeType("unisex");
    setEditSortOrder(product.sortOrder ?? 0);
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
      setEditSortOrder(productDetails.sortOrder ?? 0);
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
        sortOrder: editSortOrder,
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
    setSizeToDelete(sizeId);
  };

  const confirmDeleteSize = () => {
    if (sizeToDelete == null) return;
    deleteSizeMutation.mutate(sizeToDelete, {
      onSuccess: () => {
        toast.success("Size deleted successfully");
        setSizeToDelete(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to delete size");
      },
    });
  };

  const handleEditSizeClick = (size: { id: number; size: string; stock: number }) => {
    setEditingSizeId(size.id);
    setEditSizeValue(size.size);
    setEditSizeStock(size.stock);
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
        },
      },
      {
        onSuccess: () => {
          toast.success("Size updated successfully");
          setEditingSizeId(null);
          setEditSizeValue("");
          setEditSizeStock(0);
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
      },
      {
        onSuccess: () => {
          toast.success("Size added successfully");
          setShowAddSizeInEdit(false);
          setNewEditSizeValue("");
          setNewEditSizeStock(0);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add size");
        },
      }
    );
  };

  // Regional price handlers (edit dialog)
  const handleAddRegionPrice = (sizeId: number) => {
    if (!editProductId) return;

    if (!newPriceRegionId || newPriceValue === "") {
      toast.error("Please select a region and enter a price");
      return;
    }

    createRegionPriceMutation.mutate(
      {
        productId: editProductId,
        data: {
          productSizeId: sizeId,
          regionId: Number(newPriceRegionId),
          price: Number(newPriceValue),
        },
      },
      {
        onSuccess: () => {
          toast.success("Regional price added");
          setAddingPriceForSizeId(null);
          setNewPriceRegionId("");
          setNewPriceValue("");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add regional price");
        },
      }
    );
  };

  const handleEditPriceClick = (price: ProductRegionPrice) => {
    setEditingPriceId(price.id);
    setEditPriceValue(price.price);
    setEditPriceActive(price.active);
  };

  const handleCancelEditPrice = () => {
    setEditingPriceId(null);
    setEditPriceValue("");
    setEditPriceActive(true);
  };

  const handleUpdatePrice = () => {
    if (editingPriceId == null) return;

    updateRegionPriceMutation.mutate(
      {
        id: editingPriceId,
        data: { price: Number(editPriceValue), active: editPriceActive },
      },
      {
        onSuccess: () => {
          toast.success("Regional price updated");
          handleCancelEditPrice();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update regional price");
        },
      }
    );
  };

  const confirmDeletePrice = () => {
    if (priceToDelete == null) return;
    deleteRegionPriceMutation.mutate(priceToDelete, {
      onSuccess: () => {
        toast.success("Regional price removed");
        setPriceToDelete(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to remove regional price");
      },
    });
  };

  // Regional discount handlers (edit dialog)
  const resetAddDiscountForm = () => {
    setShowAddDiscount(false);
    setNewDiscountRegionId("");
    setNewDiscountPercentage("");
    setNewDiscountStart("");
    setNewDiscountEnd("");
    setNewDiscountActive(true);
  };

  const handleAddDiscount = () => {
    if (!editProductId) return;

    if (!newDiscountRegionId || newDiscountPercentage === "" || !newDiscountStart) {
      toast.error("Please select a region, a percentage, and a start date/time");
      return;
    }

    createRegionDiscountMutation.mutate(
      {
        productId: editProductId,
        data: {
          regionId: Number(newDiscountRegionId),
          discountPercentage: Number(newDiscountPercentage),
          startDateTime: new Date(newDiscountStart).toISOString(),
          endDateTime: newDiscountEnd ? new Date(newDiscountEnd).toISOString() : null,
          active: newDiscountActive,
        },
      },
      {
        onSuccess: () => {
          toast.success("Discount added");
          resetAddDiscountForm();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add discount");
        },
      }
    );
  };

  const handleEditDiscountClick = (discount: ProductRegionDiscount) => {
    setEditingDiscountId(discount.id);
    setEditDiscountPercentage(discount.discountPercentage);
    setEditDiscountStart(toDatetimeLocalValue(discount.startDateTime));
    setEditDiscountEnd(toDatetimeLocalValue(discount.endDateTime));
    setEditDiscountActive(discount.active);
  };

  const handleCancelEditDiscount = () => {
    setEditingDiscountId(null);
    setEditDiscountPercentage("");
    setEditDiscountStart("");
    setEditDiscountEnd("");
    setEditDiscountActive(true);
  };

  const handleUpdateDiscount = () => {
    if (editingDiscountId == null) return;

    updateRegionDiscountMutation.mutate(
      {
        id: editingDiscountId,
        data: {
          discountPercentage: Number(editDiscountPercentage),
          startDateTime: editDiscountStart ? new Date(editDiscountStart).toISOString() : undefined,
          endDateTime: editDiscountEnd ? new Date(editDiscountEnd).toISOString() : null,
          active: editDiscountActive,
        },
      },
      {
        onSuccess: () => {
          toast.success("Discount updated");
          handleCancelEditDiscount();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update discount");
        },
      }
    );
  };

  const confirmDeleteDiscount = () => {
    if (discountToDelete == null) return;
    deleteRegionDiscountMutation.mutate(discountToDelete, {
      onSuccess: () => {
        toast.success("Discount removed");
        setDiscountToDelete(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to remove discount");
      },
    });
  };

  // Regional promotion handlers (edit dialog)
  const resetAddPromotionForm = () => {
    setShowAddPromotion(false);
    setNewPromotionRegionId("");
    setNewPromotionFreeShipping(false);
    setNewPromotionWelcomeActive(false);
    setNewPromotionWelcomePercentage("");
    setNewPromotionWelcomeStart("");
    setNewPromotionWelcomeEnd("");
  };

  // The highest normal discount configured for a region — a welcome offer must beat it
  const getHighestDiscountForRegion = (regionId: number) => {
    const forRegion = regionDiscounts.filter((d) => d.region.id === regionId);
    if (forRegion.length === 0) return 0;
    return Math.max(...forRegion.map((d) => Number(d.discountPercentage)));
  };

  const handleAddPromotion = () => {
    if (!editProductId) return;

    if (!newPromotionRegionId) {
      toast.error("Please select a region");
      return;
    }

    if (newPromotionWelcomeActive) {
      const percentage = Number(newPromotionWelcomePercentage);
      if (!newPromotionWelcomePercentage || percentage <= 0) {
        toast.error("An active welcome offer requires a discount greater than zero");
        return;
      }
      if (!newPromotionWelcomeStart || !newPromotionWelcomeEnd) {
        toast.error("Welcome offer start and end date/time are required when active");
        return;
      }
      if (new Date(newPromotionWelcomeEnd) <= new Date(newPromotionWelcomeStart)) {
        toast.error("Welcome offer end date must be after its start date");
        return;
      }
      const highestDiscount = getHighestDiscountForRegion(Number(newPromotionRegionId));
      if (percentage <= highestDiscount) {
        toast.error(`Welcome discount must be greater than the highest normal discount (${highestDiscount}%)`);
        return;
      }
    }

    createRegionPromotionMutation.mutate(
      {
        productId: editProductId,
        data: {
          regionId: Number(newPromotionRegionId),
          freeShipping: newPromotionFreeShipping,
          welcomeDiscountPercentage: newPromotionWelcomePercentage ? Number(newPromotionWelcomePercentage) : 0,
          welcomeOfferActive: newPromotionWelcomeActive,
          welcomeOfferStartAt: newPromotionWelcomeStart ? new Date(newPromotionWelcomeStart).toISOString() : null,
          welcomeOfferEndAt: newPromotionWelcomeEnd ? new Date(newPromotionWelcomeEnd).toISOString() : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Promotion added");
          resetAddPromotionForm();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add promotion");
        },
      }
    );
  };

  const handleEditPromotionClick = (promotion: ProductRegionPromotion) => {
    setEditingPromotionId(promotion.id);
    setEditPromotionFreeShipping(promotion.freeShipping);
    setEditPromotionWelcomeActive(promotion.welcomeOfferActive);
    setEditPromotionWelcomePercentage(promotion.welcomeDiscountPercentage);
    setEditPromotionWelcomeStart(toDatetimeLocalValue(promotion.welcomeOfferStartAt));
    setEditPromotionWelcomeEnd(toDatetimeLocalValue(promotion.welcomeOfferEndAt));
  };

  const handleCancelEditPromotion = () => {
    setEditingPromotionId(null);
    setEditPromotionFreeShipping(false);
    setEditPromotionWelcomeActive(false);
    setEditPromotionWelcomePercentage("");
    setEditPromotionWelcomeStart("");
    setEditPromotionWelcomeEnd("");
  };

  const handleUpdatePromotion = (regionId: number) => {
    if (editingPromotionId == null) return;

    if (editPromotionWelcomeActive) {
      const percentage = Number(editPromotionWelcomePercentage);
      if (!editPromotionWelcomePercentage || percentage <= 0) {
        toast.error("An active welcome offer requires a discount greater than zero");
        return;
      }
      if (!editPromotionWelcomeStart || !editPromotionWelcomeEnd) {
        toast.error("Welcome offer start and end date/time are required when active");
        return;
      }
      if (new Date(editPromotionWelcomeEnd) <= new Date(editPromotionWelcomeStart)) {
        toast.error("Welcome offer end date must be after its start date");
        return;
      }
      const highestDiscount = getHighestDiscountForRegion(regionId);
      if (percentage <= highestDiscount) {
        toast.error(`Welcome discount must be greater than the highest normal discount (${highestDiscount}%)`);
        return;
      }
    }

    updateRegionPromotionMutation.mutate(
      {
        id: editingPromotionId,
        data: {
          freeShipping: editPromotionFreeShipping,
          welcomeDiscountPercentage: editPromotionWelcomePercentage ? Number(editPromotionWelcomePercentage) : 0,
          welcomeOfferActive: editPromotionWelcomeActive,
          welcomeOfferStartAt: editPromotionWelcomeStart ? new Date(editPromotionWelcomeStart).toISOString() : null,
          welcomeOfferEndAt: editPromotionWelcomeEnd ? new Date(editPromotionWelcomeEnd).toISOString() : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Promotion updated");
          handleCancelEditPromotion();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update promotion");
        },
      }
    );
  };

  const confirmDeletePromotion = () => {
    if (promotionToDelete == null) return;
    deleteRegionPromotionMutation.mutate(promotionToDelete, {
      onSuccess: () => {
        toast.success("Promotion removed");
        setPromotionToDelete(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to remove promotion");
      },
    });
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
    } catch {
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
    setTranslationToDelete(translationId);
  };

  const confirmDeleteTranslation = () => {
    if (translationToDelete == null) return;
    deleteTranslationMutation.mutate(translationToDelete, {
      onSuccess: () => {
        toast.success("Translation deleted successfully");
        setTranslationToDelete(null);
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
    formState: {},
  } = useForm<FormValues>({
    defaultValues: {
      perfumeType: "",
      sortOrder: 1,
      translations: [{ languageId: "", categoryId: "", title: "", description: "" }],
    },
  });

  const {
    fields: translationFields,
    append: appendTranslation,
    remove: removeTranslation,
  } = useFieldArray({
    control,
    name: "translations",
  });

  // Draft sizes + regional prices for the create-product form
  const draftKeyRef = useRef(0);
  const nextDraftKey = () => `d${draftKeyRef.current++}`;
  const emptyDraftSize = (): DraftSize => ({
    key: nextDraftKey(),
    size: "",
    stock: 0,
    regionalPrices: [],
    pendingRegionId: "",
    pendingPrice: "",
  });
  const [draftSizes, setDraftSizes] = useState<DraftSize[]>(() => [emptyDraftSize()]);

  const addDraftSize = () => {
    setDraftSizes((prev) => [...prev, emptyDraftSize()]);
  };

  const removeDraftSize = (key: string) => {
    setDraftSizes((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));
  };

  const updateDraftSize = (key: string, patch: Partial<Pick<DraftSize, "size" | "stock">>) => {
    setDraftSizes((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const updateDraftPending = (
    key: string,
    patch: Partial<Pick<DraftSize, "pendingRegionId" | "pendingPrice">>
  ) => {
    setDraftSizes((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const commitDraftRegionalPrice = (key: string) => {
    setDraftSizes((prev) =>
      prev.map((s) => {
        if (s.key !== key || !s.pendingRegionId || s.pendingPrice === "") return s;
        return {
          ...s,
          regionalPrices: [
            ...s.regionalPrices,
            { key: nextDraftKey(), regionId: s.pendingRegionId, price: s.pendingPrice },
          ],
          pendingRegionId: "",
          pendingPrice: "",
        };
      })
    );
  };

  const removeDraftRegionalPrice = (sizeKey: string, priceKey: string) => {
    setDraftSizes((prev) =>
      prev.map((s) =>
        s.key === sizeKey
          ? { ...s, regionalPrices: s.regionalPrices.filter((rp) => rp.key !== priceKey) }
          : s
      )
    );
  };

  // Draft regional discounts for the create-product form. Optional — a
  // brand-new product starts with none.
  const emptyDraftDiscount = (): DraftDiscount => ({
    key: nextDraftKey(),
    regionId: "",
    discountPercentage: "",
    startDateTime: "",
    endDateTime: "",
    active: true,
  });
  const [draftDiscounts, setDraftDiscounts] = useState<DraftDiscount[]>([]);

  const addDraftDiscount = () => {
    setDraftDiscounts((prev) => [...prev, emptyDraftDiscount()]);
  };

  const removeDraftDiscount = (key: string) => {
    setDraftDiscounts((prev) => prev.filter((d) => d.key !== key));
  };

  const updateDraftDiscount = (key: string, patch: Partial<DraftDiscount>) => {
    setDraftDiscounts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };

  // Draft promotions (free shipping / welcome offer) for the create-product form.
  // Optional — a brand-new product starts with none.
  const emptyDraftPromotion = (): DraftPromotion => ({
    key: nextDraftKey(),
    regionId: "",
    freeShipping: false,
    welcomeOfferActive: false,
    welcomeDiscountPercentage: "",
    welcomeOfferStartAt: "",
    welcomeOfferEndAt: "",
  });
  const [draftPromotions, setDraftPromotions] = useState<DraftPromotion[]>([]);

  const addDraftPromotion = () => {
    setDraftPromotions((prev) => [...prev, emptyDraftPromotion()]);
  };

  const removeDraftPromotion = (key: string) => {
    setDraftPromotions((prev) => prev.filter((p) => p.key !== key));
  };

  const updateDraftPromotion = (key: string, patch: Partial<DraftPromotion>) => {
    setDraftPromotions((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

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
    setDraftSizes([emptyDraftSize()]);
    setDraftDiscounts([]);
    setDraftPromotions([]);
    setCreateActiveTab("basic");
  };

  // Since the submit button only shows on the last tab, a react-hook-form
  // validation failure (e.g. missing Sort Order or a translation field) could
  // otherwise fail silently on a tab the user isn't looking at.
  const onCreateFormInvalid = (formErrors: FieldErrors<FormValues>) => {
    if (formErrors.perfumeType || formErrors.sortOrder) {
      setCreateActiveTab("basic");
    } else if (formErrors.translations) {
      setCreateActiveTab("translations");
    }
    toast.error("Please fix the highlighted fields before creating the product.");
  };

  const onSubmit = async (data: FormValues) => {
    // Validation — since only the last tab shows the submit button, a failure
    // on an earlier (possibly hidden) tab jumps the user back to it.
    if (!thumbnail) {
      toast.error("Thumbnail is required");
      setCreateActiveTab("images");
      return;
    }

    // Check for English translation (languageId 1 or code 'en')
    const englishLang = languages?.find((l) => l.code === "en");
    const hasEnglish = data.translations.some(
      (t) => Number(t.languageId) === englishLang?.id
    );

    if (!hasEnglish) {
      toast.error("English (en) translation is mandatory");
      setCreateActiveTab("translations");
      return;
    }

    // Validate sizes (a size with no price for a given region simply won't be
    // visible to customers in that region — that's fine, so it isn't validated here)
    const seenSizeNames = new Set<string>();
    for (const s of draftSizes) {
      if (!s.size || s.size.trim() === "") {
        toast.error("Please select a size for every size row");
        setCreateActiveTab("sizes");
        return;
      }
      if (seenSizeNames.has(s.size)) {
        toast.error(`Duplicate size "${s.size}" is not allowed.`);
        setCreateActiveTab("sizes");
        return;
      }
      seenSizeNames.add(s.size);
    }

    // Validate discounts (optional — a product can have zero)
    for (const d of draftDiscounts) {
      if (!d.regionId) {
        toast.error("Please select a region for every discount row");
        setCreateActiveTab("offers");
        return;
      }
      const percentage = Number(d.discountPercentage);
      if (!d.discountPercentage || percentage <= 0) {
        toast.error("Discount percentage must be greater than zero");
        setCreateActiveTab("offers");
        return;
      }
      if (!d.startDateTime) {
        toast.error("Please set a start date/time for every discount");
        setCreateActiveTab("offers");
        return;
      }
      if (d.endDateTime && new Date(d.endDateTime) <= new Date(d.startDateTime)) {
        toast.error("Discount end date must be after its start date");
        setCreateActiveTab("offers");
        return;
      }
    }

    // Validate promotions (optional — a product can have zero)
    const seenPromotionRegions = new Set<string>();
    for (const p of draftPromotions) {
      if (!p.regionId) {
        toast.error("Please select a region for every promotion row");
        setCreateActiveTab("offers");
        return;
      }
      if (seenPromotionRegions.has(p.regionId)) {
        toast.error("Only one promotion is allowed per region.");
        setCreateActiveTab("offers");
        return;
      }
      seenPromotionRegions.add(p.regionId);

      if (p.welcomeOfferActive) {
        const percentage = Number(p.welcomeDiscountPercentage);
        if (!p.welcomeDiscountPercentage || percentage <= 0) {
          toast.error("An active welcome offer requires a discount greater than zero");
          setCreateActiveTab("offers");
          return;
        }
        if (!p.welcomeOfferStartAt || !p.welcomeOfferEndAt) {
          toast.error("Welcome offer start and end date/time are required when active");
          setCreateActiveTab("offers");
          return;
        }
        if (new Date(p.welcomeOfferEndAt) <= new Date(p.welcomeOfferStartAt)) {
          toast.error("Welcome offer end date must be after its start date");
          setCreateActiveTab("offers");
          return;
        }
      }
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
        perfumeType: data.perfumeType || undefined,
        sortOrder: data.sortOrder,
        thumbnail: thumbnailData,
        images: imagesData.length > 0 ? imagesData : undefined,
        sizes: draftSizes.map((s) => ({
          size: s.size || null,
          stock: Number(s.stock),
          regionalPrices: s.regionalPrices.map((rp) => ({
            regionId: Number(rp.regionId),
            price: Number(rp.price),
          })),
        })),
        translations: data.translations.map((t) => ({
          languageId: Number(t.languageId),
          categoryId: Number(t.categoryId),
          title: t.title,
          description: t.description,
        })),
      };

      const created = await createMutation.mutateAsync(productData);
      const newProductId = created.data.productId;

      // Discounts have their own endpoint and need an existing productId,
      // so they're created as follow-up calls once the product exists.
      for (const d of draftDiscounts) {
        try {
          await createRegionDiscountMutation.mutateAsync({
            productId: newProductId,
            data: {
              regionId: Number(d.regionId),
              discountPercentage: Number(d.discountPercentage),
              startDateTime: new Date(d.startDateTime).toISOString(),
              endDateTime: d.endDateTime ? new Date(d.endDateTime).toISOString() : null,
              active: d.active,
            },
          });
        } catch (discountError) {
          toast.error(
            `Product created, but a discount failed to save: ${
              discountError instanceof Error ? discountError.message : "unknown error"
            }`
          );
        }
      }

      // Promotions have their own endpoint and need an existing productId,
      // so they're created as follow-up calls once the product exists.
      for (const p of draftPromotions) {
        try {
          await createRegionPromotionMutation.mutateAsync({
            productId: newProductId,
            data: {
              regionId: Number(p.regionId),
              freeShipping: p.freeShipping,
              welcomeDiscountPercentage: p.welcomeDiscountPercentage ? Number(p.welcomeDiscountPercentage) : 0,
              welcomeOfferActive: p.welcomeOfferActive,
              welcomeOfferStartAt: p.welcomeOfferStartAt ? new Date(p.welcomeOfferStartAt).toISOString() : null,
              welcomeOfferEndAt: p.welcomeOfferEndAt ? new Date(p.welcomeOfferEndAt).toISOString() : null,
            },
          });
        } catch (promoError) {
          toast.error(
            `Product created, but a promotion failed to save: ${
              promoError instanceof Error ? promoError.message : "unknown error"
            }`
          );
        }
      }

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
  const watchedSortOrder = watch("sortOrder");
  const watchedTranslations = watch("translations");

  // Basic Info, Images, and Translations are mandatory — Next (or Create
  // Product, on the last tab) stays disabled until each is actually filled
  // in. Sizes and Offers are optional, so they never block progress.
  const isBasicInfoTabComplete = Number.isFinite(watchedSortOrder);
  const isImagesTabComplete = !!thumbnail;
  const isTranslationsTabComplete = (() => {
    const englishLang = languages?.find((l) => l.code === "en");
    const hasEnglish = watchedTranslations?.some((t) => Number(t.languageId) === englishLang?.id);
    if (!hasEnglish) return false;
    return watchedTranslations.every(
      (t) => t.languageId && t.categoryId && t.title.trim() !== "" && t.description.trim() !== ""
    );
  })();
  const isCreateTabComplete: Record<string, boolean> = {
    basic: isBasicInfoTabComplete,
    images: isImagesTabComplete,
    sizes: true,
    offers: true,
    translations: isTranslationsTabComplete,
  };
  const canAdvanceFromCreateTab = isCreateTabComplete[createActiveTab] ?? true;

  // How much has been added on each optional step, shown as a small hint
  // under its stepper icon (e.g. "2 added") instead of a checkmark.
  const stepBadgeCount = (id: string) => {
    switch (id) {
      case "sizes":
        return draftSizes.length;
      case "offers":
        return draftDiscounts.length + draftPromotions.length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
            Products
          </h2>
          <p className="text-muted-foreground">Manage your perfume catalog</p>
        </div>
        <Button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Search products..." className="pl-8" />
          </div>
          <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
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
            data={paginatedProducts}
            columns={productColumns(handleEditClick, handleDeleteClick)}
            isLoading={productsLoading}
            error={productsError}
            emptyMessage="No products found. Add your first product to get started."
          />
          <Pagination
            page={productsPage}
            totalPages={productsTotalPages}
            onPageChange={setProductsPage}
            totalResults={products?.length}
            pageSize={productsPageSize}
            onPageSizeChange={handleProductsPageSizeChange}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="max-w-sm">
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

      {/* Delete Size Confirmation */}
      <Dialog
        open={sizeToDelete != null}
        onOpenChange={(open) => {
          if (!open) setSizeToDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this size? This action cannot be undone.</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSizeToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSize}
              disabled={deleteSizeMutation.isPending}
            >
              {deleteSizeMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Regional Price Confirmation */}
      <Dialog
        open={priceToDelete != null}
        onOpenChange={(open) => {
          if (!open) setPriceToDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to remove this regional price? This action cannot be undone.</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPriceToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePrice}
              disabled={deleteRegionPriceMutation.isPending}
            >
              {deleteRegionPriceMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Regional Discount Confirmation */}
      <Dialog
        open={discountToDelete != null}
        onOpenChange={(open) => {
          if (!open) setDiscountToDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to remove this discount? This action cannot be undone.</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDiscountToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteDiscount}
              disabled={deleteRegionDiscountMutation.isPending}
            >
              {deleteRegionDiscountMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Regional Promotion Confirmation */}
      <Dialog
        open={promotionToDelete != null}
        onOpenChange={(open) => {
          if (!open) setPromotionToDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to remove this promotion? This action cannot be undone.</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPromotionToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePromotion}
              disabled={deleteRegionPromotionMutation.isPending}
            >
              {deleteRegionPromotionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Translation Confirmation */}
      <Dialog
        open={translationToDelete != null}
        onOpenChange={(open) => {
          if (!open) setTranslationToDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this translation? This action cannot be undone.</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTranslationToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTranslation}
              disabled={deleteTranslationMutation.isPending}
            >
              {deleteTranslationMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={openEditDialog} onOpenChange={(open) => {
        setOpenEditDialog(open);
        if (!open) {
          setEditActiveTab("basic");
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
          setExpandedSizeIds(new Set());
          // Reset regional price state
          setAddingPriceForSizeId(null);
          setNewPriceRegionId("");
          setNewPriceValue("");
          setEditingPriceId(null);
          setEditPriceValue("");
          setEditPriceActive(true);
          // Reset regional discount state
          setShowAddDiscount(false);
          setNewDiscountRegionId("");
          setNewDiscountPercentage("");
          setNewDiscountStart("");
          setNewDiscountEnd("");
          setNewDiscountActive(true);
          setEditingDiscountId(null);
          setEditDiscountPercentage("");
          setEditDiscountStart("");
          setEditDiscountEnd("");
          setEditDiscountActive(true);
          // Reset regional promotion state
          setShowAddPromotion(false);
          setNewPromotionRegionId("");
          setNewPromotionFreeShipping(false);
          setNewPromotionWelcomeActive(false);
          setNewPromotionWelcomePercentage("");
          setNewPromotionWelcomeStart("");
          setNewPromotionWelcomeEnd("");
          setEditingPromotionId(null);
          setEditPromotionFreeShipping(false);
          setEditPromotionWelcomeActive(false);
          setEditPromotionWelcomePercentage("");
          setEditPromotionWelcomeStart("");
          setEditPromotionWelcomeEnd("");
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
            <Tabs value={editActiveTab} onValueChange={setEditActiveTab} className="mt-4">
              {/* Mobile: dropdown instead of tab row */}
              <Select value={editActiveTab} onValueChange={setEditActiveTab}>
                <SelectTrigger className="w-full sm:hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Info</SelectItem>
                  <SelectItem value="images">Images</SelectItem>
                  <SelectItem value="sizes">Sizes ({productDetails.sizes.length})</SelectItem>
                  <SelectItem value="offers">Offers ({regionDiscounts.length + regionPromotions.length})</SelectItem>
                  <SelectItem value="translations">Translations ({productDetails.translations.length})</SelectItem>
                </SelectContent>
              </Select>
              <TabsList className="hidden h-11 w-full grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 sm:grid sm:grid-cols-5">
                <TabsTrigger
                  value="basic"
                  className="gap-1.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Package className="h-3.5 w-3.5" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="gap-1.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Images
                </TabsTrigger>
                <TabsTrigger
                  value="sizes"
                  className="gap-1.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  Sizes
                  <span className="ml-0.5 rounded-full bg-black/10 px-1.5 text-[10px] font-normal dark:bg-white/15">
                    {productDetails.sizes.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="offers"
                  className="gap-1.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Percent className="h-3.5 w-3.5" />
                  Offers
                  <span className="ml-0.5 rounded-full bg-black/10 px-1.5 text-[10px] font-normal dark:bg-white/15">
                    {regionDiscounts.length + regionPromotions.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="translations"
                  className="gap-1.5 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Languages className="h-3.5 w-3.5" />
                  Translations
                  <span className="ml-0.5 rounded-full bg-black/10 px-1.5 text-[10px] font-normal dark:bg-white/15">
                    {productDetails.translations.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Perfume Type</label>
                    <Select
                      value={editPerfumeType ?? "none"}
                      onValueChange={(value) =>
                        setEditPerfumeType(value === "none" ? null : (value as "male" | "female" | "unisex"))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort Order</label>
                    <Input
                      type="number"
                      step="1"
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(Number(e.target.value))}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {/* Section header */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-amber-500" />
                        Sizes &amp; Regional Pricing
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Each size can carry a different price per region.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {productDetails.sizes.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpandedSizeIds(
                              expandedSizeIds.size === productDetails.sizes.length
                                ? new Set()
                                : new Set(productDetails.sizes.map((s) => s.id))
                            )
                          }
                        >
                          {expandedSizeIds.size === productDetails.sizes.length ? "Collapse All" : "Expand All"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setShowAddSizeInEdit(!showAddSizeInEdit)}
                        className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Size
                      </Button>
                    </div>
                  </div>

                  {/* Add Size Form */}
                  {showAddSizeInEdit && (
                    <Card className="border-amber-500/50 bg-amber-500/5">
                      <CardContent className="pt-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Size *</Label>
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
                            <Label className="text-xs font-medium">Stock *</Label>
                            <Input
                              type="number"
                              min="0"
                              value={newEditSizeStock}
                              onChange={(e) => setNewEditSizeStock(Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setShowAddSizeInEdit(false);
                                setNewEditSizeValue("");
                                setNewEditSizeStock(0);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAddSizeInEdit}
                              disabled={createSizeMutation.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              {createSizeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Add"
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add its regional prices from the size card below once it&apos;s created.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Size cards */}
                  {productDetails.sizes.length > 0 ? (
                    <div className="space-y-4">
                      {productDetails.sizes.map((size) => {
                        const prices = pricesBySizeId.get(size.id) ?? [];
                        const availableRegionsForSize = activeRegions.filter(
                          (r) => !prices.some((p) => p.region.id === r.id)
                        );
                        const isExpanded = expandedSizeIds.has(size.id);

                        return (
                          <Card key={size.id} className="overflow-hidden py-0">
                            <CardHeader className="py-3 bg-muted/40">
                              <div className="flex items-center justify-between gap-2">
                                {editingSizeId === size.id ? (
                                  <div className="flex flex-1 flex-wrap items-center gap-2">
                                    <Select value={editSizeValue} onValueChange={setEditSizeValue}>
                                      <SelectTrigger className="w-28">
                                        <SelectValue placeholder="Size" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SIZE_OPTIONS.map((option) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={editSizeStock}
                                      onChange={(e) => setEditSizeStock(Number(e.target.value))}
                                      className="w-24"
                                      placeholder="Stock"
                                    />
                                    <Button size="sm" onClick={handleUpdateSize} disabled={updateSizeMutation.isPending}>
                                      {updateSizeMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        "Save"
                                      )}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={handleCancelEditSize}>
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => toggleSizeExpanded(size.id)}
                                      className="flex flex-1 items-center gap-3 text-left"
                                    >
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-pink-500 text-white">
                                        <Ruler className="h-4 w-4" />
                                      </div>
                                      <div>
                                        <CardTitle className="text-sm">{size.size}</CardTitle>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                          <Badge variant={size.stock > 0 ? "default" : "destructive"} className="text-xs">
                                            {size.stock > 0 ? `${size.stock} in stock` : "Out of stock"}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs gap-1">
                                            <Globe className="h-3 w-3" />
                                            {prices.length} region{prices.length === 1 ? "" : "s"} priced
                                          </Badge>
                                        </div>
                                      </div>
                                    </button>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditSizeClick(size)}
                                        title="Edit size"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteSize(size.id)}
                                        disabled={deleteSizeMutation.isPending}
                                        title="Delete size"
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleSizeExpanded(size.id)}
                                        title={isExpanded ? "Collapse" : "Expand"}
                                      >
                                        <ChevronDown
                                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </CardHeader>

                            {isExpanded && (
                            <CardContent className="py-4 space-y-3">
                              {prices.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {prices.map((price) => (
                                    <div
                                      key={price.id}
                                      className={`rounded-lg border p-3 space-y-2 ${
                                        price.active ? "bg-background" : "bg-muted/40 opacity-70"
                                      }`}
                                    >
                                      {editingPriceId === price.id ? (
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                            <MapPin className="h-3 w-3" /> {price.region.name}
                                          </div>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editPriceValue}
                                            onChange={(e) => setEditPriceValue(e.target.value)}
                                            className="h-8"
                                          />
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Switch checked={editPriceActive} onCheckedChange={setEditPriceActive} />
                                              <span className="text-xs text-muted-foreground">Active</span>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCancelEditPrice}>
                                                Cancel
                                              </Button>
                                              <Button
                                                size="sm"
                                                className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                                onClick={handleUpdatePrice}
                                                disabled={updateRegionPriceMutation.isPending}
                                              >
                                                {updateRegionPriceMutation.isPending ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  "Save"
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                              {price.region.name}
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] px-1.5">
                                              {price.region.currencyCode}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold text-amber-600">
                                              {price.region.currencyCode} {price.price}
                                            </span>
                                            {!price.active && (
                                              <Badge variant="outline" className="text-[10px]">
                                                Inactive
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex justify-end gap-1 pt-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 px-2"
                                              onClick={() => handleEditPriceClick(price)}
                                            >
                                              <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 px-2 text-destructive hover:text-destructive"
                                              onClick={() => setPriceToDelete(price.id)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">
                                  No regional prices set for this size yet.
                                </p>
                              )}

                              <Separator />

                              {addingPriceForSizeId === size.id ? (
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                  <div className="flex-1 space-y-1">
                                    <Label className="text-xs font-medium">Region</Label>
                                    <Select value={newPriceRegionId} onValueChange={setNewPriceRegionId}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select region" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableRegionsForSize.map((r) => (
                                          <SelectItem key={r.id} value={String(r.id)}>
                                            {r.name} ({r.currencyCode})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-full sm:w-28 space-y-1">
                                    <Label className="text-xs font-medium">Price</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={newPriceValue}
                                      onChange={(e) => setNewPriceValue(e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setAddingPriceForSizeId(null);
                                        setNewPriceRegionId("");
                                        setNewPriceValue("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
                                      onClick={() => handleAddRegionPrice(size.id)}
                                      disabled={createRegionPriceMutation.isPending}
                                    >
                                      {createRegionPriceMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Add"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full border-dashed gap-1.5 text-muted-foreground hover:text-foreground"
                                  onClick={() => setAddingPriceForSizeId(size.id)}
                                  disabled={availableRegionsForSize.length === 0}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  {availableRegionsForSize.length === 0 ? "All regions priced" : "Add Region Price"}
                                </Button>
                              )}
                            </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Ruler className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No sizes added yet. Click &quot;Add Size&quot; above to add one.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Offers Tab (Discounts + Promotions) */}
              <TabsContent value="offers" className="mt-4">
                <div className="space-y-8">
                {/* Discounts section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Percent className="h-4 w-4 text-amber-500" />
                        Regional Discounts
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Schedule a percentage discount for this product in a specific region.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowAddDiscount(!showAddDiscount)}
                      className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Discount
                    </Button>
                  </div>

                  {showAddDiscount && (
                    <Card className="border-amber-500/50 bg-amber-500/5">
                      <CardContent className="pt-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Region *</Label>
                            <Select value={newDiscountRegionId} onValueChange={setNewDiscountRegionId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                              <SelectContent>
                                {(regions ?? []).map((r) => (
                                  <SelectItem key={r.id} value={String(r.id)}>
                                    {r.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Discount % *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={newDiscountPercentage}
                              onChange={(e) => setNewDiscountPercentage(e.target.value)}
                              placeholder="e.g. 15"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Start *</Label>
                            <Input
                              type="datetime-local"
                              onClick={(e) => e.currentTarget.showPicker?.()}
                              value={newDiscountStart}
                              onChange={(e) => setNewDiscountStart(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">End (optional)</Label>
                            <Input
                              type="datetime-local"
                              onClick={(e) => e.currentTarget.showPicker?.()}
                              value={newDiscountEnd}
                              onChange={(e) => setNewDiscountEnd(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch checked={newDiscountActive} onCheckedChange={setNewDiscountActive} />
                            <span className="text-xs text-muted-foreground">Active</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={resetAddDiscountForm}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleAddDiscount}
                              disabled={createRegionDiscountMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {createRegionDiscountMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Add"
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {regionDiscounts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {regionDiscounts.map((discount) => (
                        <Card key={discount.id} className={discount.active ? "" : "opacity-70"}>
                          <CardContent className="pt-4 space-y-2">
                            {editingDiscountId === discount.id ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                  <MapPin className="h-3 w-3" /> {discount.region.name}
                                </div>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={editDiscountPercentage}
                                  onChange={(e) => setEditDiscountPercentage(e.target.value)}
                                  className="h-8"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    type="datetime-local"
                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                    value={editDiscountStart}
                                    onChange={(e) => setEditDiscountStart(e.target.value)}
                                    className="h-8"
                                  />
                                  <Input
                                    type="datetime-local"
                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                    value={editDiscountEnd}
                                    onChange={(e) => setEditDiscountEnd(e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Switch checked={editDiscountActive} onCheckedChange={setEditDiscountActive} />
                                    <span className="text-xs text-muted-foreground">Active</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCancelEditDiscount}>
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                      onClick={handleUpdateDiscount}
                                      disabled={updateRegionDiscountMutation.isPending}
                                    >
                                      {updateRegionDiscountMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        "Save"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-sm font-medium">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    {discount.region.name}
                                  </div>
                                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    -{discount.discountPercentage}%
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(discount.startDateTime).toLocaleString()}
                                  {discount.endDateTime
                                    ? ` → ${new Date(discount.endDateTime).toLocaleString()}`
                                    : " → no end date"}
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <Badge variant={discount.active ? "default" : "outline"} className="text-[10px]">
                                    {discount.active ? "Active" : "Inactive"}
                                  </Badge>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2"
                                      onClick={() => handleEditDiscountClick(discount)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-destructive hover:text-destructive"
                                      onClick={() => setDiscountToDelete(discount.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Percent className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No discounts scheduled yet. Click &quot;Add Discount&quot; above to add one.
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Promotions section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Gift className="h-4 w-4 text-amber-500" />
                        Regional Promotions
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Free shipping and/or a first-order welcome offer, per region.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowAddPromotion(!showAddPromotion)}
                      className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Promotion
                    </Button>
                  </div>

                  {showAddPromotion && (
                    <Card className="border-amber-500/50 bg-amber-500/5">
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Region *</Label>
                          <Select value={newPromotionRegionId} onValueChange={setNewPromotionRegionId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {(regions ?? [])
                                .filter((r) => !regionPromotions.some((p) => p.region.id === r.id))
                                .map((r) => (
                                  <SelectItem key={r.id} value={String(r.id)}>
                                    {r.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Free Shipping</span>
                          </div>
                          <Switch checked={newPromotionFreeShipping} onCheckedChange={setNewPromotionFreeShipping} />
                        </div>

                        <div className="space-y-3 rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Welcome Offer</span>
                            </div>
                            <Switch checked={newPromotionWelcomeActive} onCheckedChange={setNewPromotionWelcomeActive} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Discount %</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={newPromotionWelcomePercentage}
                                onChange={(e) => setNewPromotionWelcomePercentage(e.target.value)}
                                placeholder="e.g. 20"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Start</Label>
                              <Input
                                type="datetime-local"
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                value={newPromotionWelcomeStart}
                                onChange={(e) => setNewPromotionWelcomeStart(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">End</Label>
                              <Input
                                type="datetime-local"
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                value={newPromotionWelcomeEnd}
                                onChange={(e) => setNewPromotionWelcomeEnd(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={resetAddPromotionForm}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddPromotion}
                            disabled={createRegionPromotionMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {createRegionPromotionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {regionPromotions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {regionPromotions.map((promotion) => (
                        <Card key={promotion.id}>
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-sm font-medium">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {promotion.region.name}
                              </div>
                              {editingPromotionId !== promotion.id && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2"
                                    onClick={() => handleEditPromotionClick(promotion)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                    onClick={() => setPromotionToDelete(promotion.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {editingPromotionId === promotion.id ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg border p-2.5">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium">Free Shipping</span>
                                  </div>
                                  <Switch
                                    checked={editPromotionFreeShipping}
                                    onCheckedChange={setEditPromotionFreeShipping}
                                  />
                                </div>
                                <div className="space-y-2 rounded-lg border p-2.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Gift className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs font-medium">Welcome Offer</span>
                                    </div>
                                    <Switch
                                      checked={editPromotionWelcomeActive}
                                      onCheckedChange={setEditPromotionWelcomeActive}
                                    />
                                  </div>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={editPromotionWelcomePercentage}
                                    onChange={(e) => setEditPromotionWelcomePercentage(e.target.value)}
                                    className="h-8"
                                    placeholder="Discount %"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      type="datetime-local"
                                      onClick={(e) => e.currentTarget.showPicker?.()}
                                      value={editPromotionWelcomeStart}
                                      onChange={(e) => setEditPromotionWelcomeStart(e.target.value)}
                                      className="h-8"
                                    />
                                    <Input
                                      type="datetime-local"
                                      onClick={(e) => e.currentTarget.showPicker?.()}
                                      value={editPromotionWelcomeEnd}
                                      onChange={(e) => setEditPromotionWelcomeEnd(e.target.value)}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCancelEditPromotion}>
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleUpdatePromotion(promotion.region.id)}
                                    disabled={updateRegionPromotionMutation.isPending}
                                  >
                                    {updateRegionPromotionMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "Save"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                                  {promotion.freeShipping ? (
                                    <Badge variant="default" className="text-[10px]">Free shipping</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No free shipping</span>
                                  )}
                                </div>
                                <div className="flex items-start gap-2">
                                  <Gift className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                  {promotion.welcomeOfferActive ? (
                                    <div className="space-y-0.5">
                                      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                        -{promotion.welcomeDiscountPercentage}% welcome offer
                                      </Badge>
                                      <p className="text-xs text-muted-foreground">
                                        {promotion.welcomeOfferStartAt
                                          ? new Date(promotion.welcomeOfferStartAt).toLocaleString()
                                          : "—"}
                                        {" → "}
                                        {promotion.welcomeOfferEndAt
                                          ? new Date(promotion.welcomeOfferEndAt).toLocaleString()
                                          : "—"}
                                      </p>
                                    </div>
                                  ) : Number(promotion.welcomeDiscountPercentage) > 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                      Welcome offer configured ({promotion.welcomeDiscountPercentage}%) but inactive
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No welcome offer</span>
                                  )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Gift className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No promotions configured yet. Click &quot;Add Promotion&quot; above to add one.
                      </p>
                    </div>
                  )}
                </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Language *</label>
                            <Select
                              value={newTranslationLanguageId?.toString() || ""}
                              onValueChange={(v) => {
                                setNewTranslationLanguageId(Number(v));
                                setNewTranslationCategoryId(null);
                              }}
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
                              disabled={!newTranslationLanguageId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories
                                  ?.filter((cat) => cat.language.id === newTranslationLanguageId)
                                  .map((cat) => (
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
                                  {categories
                                    ?.filter((cat) => cat.language.id === translation.language.id)
                                    .map((cat) => (
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
                      No translations found. Click &quot;Add Translation&quot; to add one.
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

      {/* Add Product Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Create New Product
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit, onCreateFormInvalid)} className="mt-4 flex flex-col">
            <Tabs value={createActiveTab} onValueChange={setCreateActiveTab}>
              {/* Step progress (desktop): icon stepper with a connecting line */}
              <div className="mb-6 hidden items-start sm:flex">
                {CREATE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = step.id === createActiveTab;
                  const isDone = !step.optional && isCreateTabComplete[step.id];
                  const count = stepBadgeCount(step.id);
                  return (
                    <Fragment key={step.id}>
                      <button
                        type="button"
                        onClick={() => setCreateActiveTab(step.id)}
                        className="group flex flex-col items-center gap-1.5"
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                            isActive
                              ? "border-transparent bg-gradient-to-br from-amber-500 to-pink-500 text-white shadow-md shadow-amber-500/30"
                              : isDone
                              ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "border-muted-foreground/25 bg-background text-muted-foreground group-hover:border-amber-400 group-hover:text-amber-500"
                          }`}
                        >
                          {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </span>
                        <span
                          className={`whitespace-nowrap text-xs font-medium ${
                            isActive ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {step.optional ? (count > 0 ? `${count} added` : "Optional") : " "}
                        </span>
                      </button>
                      {i < CREATE_STEPS.length - 1 && (
                        <div
                          className={`mt-[18px] h-0.5 flex-1 rounded-full transition-colors ${
                            i < createTabIndex ? "bg-gradient-to-r from-amber-500 to-pink-500" : "bg-muted"
                          }`}
                        />
                      )}
                    </Fragment>
                  );
                })}
              </div>

              {/* Mobile: dropdown instead of tab row */}
              <Select value={createActiveTab} onValueChange={setCreateActiveTab}>
                <SelectTrigger className="w-full mb-4 sm:hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Info</SelectItem>
                  <SelectItem value="images">Images</SelectItem>
                  <SelectItem value="sizes">Sizes &amp; Price ({draftSizes.length})</SelectItem>
                  <SelectItem value="offers">Offers ({draftDiscounts.length + draftPromotions.length})</SelectItem>
                  <SelectItem value="translations">Translations ({translationFields.length})</SelectItem>
                </SelectContent>
              </Select>
              <TabsList className="sr-only">
                {CREATE_STEPS.map((step) => (
                  <TabsTrigger key={step.id} value={step.id}>
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="mt-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>Core details every product needs, regardless of region.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Perfume Type</label>
                        <Select
                          value={perfumeType || "none"}
                          onValueChange={(value) =>
                            setValue("perfumeType", value === "none" ? "" : (value as "male" | "female" | "unisex"))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="unisex">Unisex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          Sort Order <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="number"
                          step="1"
                          {...register("sortOrder", { required: true, valueAsNumber: true })}
                          placeholder="1"
                        />
                        <p className="text-xs text-muted-foreground">Lower numbers appear first in the catalog.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="mt-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImagePlus className="h-4 w-4" />
                      Product Images
                    </CardTitle>
                    <CardDescription>A clear thumbnail is required — add up to 3 more angles or lifestyle shots.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Thumbnail */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-1">
                          Thumbnail <span className="text-destructive">*</span>
                        </label>
                        {thumbnailPreview && (
                          <Badge variant="outline" className="gap-1 text-[10px] border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400">
                            <Check className="h-3 w-3" />
                            Ready
                          </Badge>
                        )}
                      </div>
                      {thumbnailPreview ? (
                        <div className="group relative w-full sm:w-56 aspect-square rounded-xl overflow-hidden border-2 border-amber-400 shadow-sm">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <button
                            type="button"
                            onClick={removeThumbnail}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5 text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={() => thumbnailRef.current?.click()}
                            className="absolute bottom-2 left-2 right-2 rounded-md bg-black/60 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Change image
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => thumbnailRef.current?.click()}
                          className="w-full sm:w-56 aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 px-4 text-center hover:border-amber-500 hover:bg-amber-500/5 transition-colors"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                            <Upload className="h-5 w-5 text-amber-500" />
                          </div>
                          <span className="text-sm font-medium">Click to upload</span>
                          <span className="text-xs text-muted-foreground">PNG or JPG, up to 10MB</span>
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

                    <Separator />

                    {/* Additional Images */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Additional Images</label>
                        <span className="text-xs text-muted-foreground">{images.length}/3</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 max-w-md">
                        {[0, 1, 2].map((slot) => {
                          const preview = imagePreviews[slot];
                          if (preview) {
                            return (
                              <div key={slot} className="group relative aspect-square rounded-lg overflow-hidden border">
                                <img
                                  src={preview}
                                  alt={`Preview ${slot + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(slot)}
                                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Remove"
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              </div>
                            );
                          }
                          const isNextSlot = slot === images.length;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={!isNextSlot}
                              onClick={() => imagesRef.current?.click()}
                              className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                                isNextSlot
                                  ? "hover:border-amber-500 hover:bg-amber-500/5 cursor-pointer"
                                  : "opacity-40 cursor-not-allowed"
                              }`}
                            >
                              {isNextSlot ? (
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        ref={imagesRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesChange}
                        className="hidden"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sizes Tab */}
              <TabsContent value="sizes" className="mt-4">
                <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Sizes &amp; Regional Pricing
                    </CardTitle>
                    <CardDescription>
                      Add at least one size, with a price for every active region.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDraftSize}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Size
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {draftSizes.map((sizeDraft) => {
                  const availableRegions = activeRegions.filter(
                    (r) => !sizeDraft.regionalPrices.some((rp) => Number(rp.regionId) === r.id)
                  );
                  const missingRegions = activeRegions.filter(
                    (r) => !sizeDraft.regionalPrices.some((rp) => Number(rp.regionId) === r.id)
                  );

                  return (
                    <div key={sizeDraft.key} className="rounded-lg border bg-muted/30 overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 border-b bg-muted/50">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-medium">Size *</label>
                          <Select
                            value={sizeDraft.size}
                            onValueChange={(value) => updateDraftSize(sizeDraft.key, { size: value })}
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
                        <div className="w-full sm:w-32 space-y-1">
                          <label className="text-xs font-medium">Stock *</label>
                          <Input
                            type="number"
                            min="0"
                            value={sizeDraft.stock}
                            onChange={(e) => updateDraftSize(sizeDraft.key, { stock: Number(e.target.value) })}
                            placeholder="0"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDraftSize(sizeDraft.key)}
                          disabled={draftSizes.length === 1}
                          className="text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="p-3 space-y-3">
                        {sizeDraft.regionalPrices.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {sizeDraft.regionalPrices.map((rp) => {
                              const region = activeRegions.find((r) => String(r.id) === rp.regionId);
                              return (
                                <div
                                  key={rp.key}
                                  className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                                >
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium">{region?.name ?? "Region"}</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5">
                                      {region?.currencyCode}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-amber-600">{rp.price}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeDraftRegionalPrice(sizeDraft.key, rp.key)}
                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {missingRegions.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Not priced yet (hidden from these regions): {missingRegions.map((r) => r.name).join(", ")}
                          </p>
                        )}

                        {availableRegions.length > 0 && (
                          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                            <div className="flex-1 space-y-1">
                              <label className="text-xs font-medium">Region</label>
                              <Select
                                value={sizeDraft.pendingRegionId}
                                onValueChange={(value) =>
                                  updateDraftPending(sizeDraft.key, { pendingRegionId: value })
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRegions.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                      {r.name} ({r.currencyCode})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-full sm:w-28 space-y-1">
                              <label className="text-xs font-medium">Price</label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sizeDraft.pendingPrice}
                                onChange={(e) =>
                                  updateDraftPending(sizeDraft.key, { pendingPrice: e.target.value })
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1 border-dashed"
                              onClick={() => commitDraftRegionalPrice(sizeDraft.key)}
                              disabled={!sizeDraft.pendingRegionId || sizeDraft.pendingPrice === ""}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Price
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
                </Card>
              </TabsContent>

              {/* Offers Tab (Discounts + Promotions) */}
              <TabsContent value="offers" className="mt-4 space-y-6">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Discounts
                        </CardTitle>
                        <CardDescription>
                          Optional — a scheduled percentage discount, per region.
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDraftDiscount}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Discount
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {draftDiscounts.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No discounts configured. You can add these later too.
                      </p>
                    )}
                    {draftDiscounts.map((discount) => {
                      return (
                        <div key={discount.key} className="rounded-lg border bg-muted/30 overflow-hidden">
                          <div className="flex items-center justify-between gap-3 p-3 border-b bg-muted/50">
                            <div className="flex-1 space-y-1 sm:max-w-xs">
                              <label className="text-xs font-medium">Region *</label>
                              <Select
                                value={discount.regionId}
                                onValueChange={(value) => updateDraftDiscount(discount.key, { regionId: value })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activeRegions.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                      {r.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDraftDiscount(discount.key)}
                              className="text-destructive hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="p-3 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-medium">Discount % *</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={discount.discountPercentage}
                                  onChange={(e) =>
                                    updateDraftDiscount(discount.key, { discountPercentage: e.target.value })
                                  }
                                  placeholder="e.g. 15"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium">Start *</label>
                                <Input
                                  type="datetime-local"
                                  onClick={(e) => e.currentTarget.showPicker?.()}
                                  value={discount.startDateTime}
                                  onChange={(e) =>
                                    updateDraftDiscount(discount.key, { startDateTime: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium">End (optional)</label>
                                <Input
                                  type="datetime-local"
                                  onClick={(e) => e.currentTarget.showPicker?.()}
                                  value={discount.endDateTime}
                                  onChange={(e) =>
                                    updateDraftDiscount(discount.key, { endDateTime: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={discount.active}
                                onCheckedChange={(checked) => updateDraftDiscount(discount.key, { active: checked })}
                              />
                              <span className="text-xs text-muted-foreground">Active</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Promotions
                        </CardTitle>
                        <CardDescription>
                          Optional — free shipping and/or a first-order welcome offer, per region.
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDraftPromotion}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Promotion
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {draftPromotions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No promotions configured. The product will launch without free shipping or a
                        welcome offer — you can add these later too.
                      </p>
                    )}
                    {draftPromotions.map((promo) => {
                      const availableRegions = activeRegions.filter(
                        (r) =>
                          !draftPromotions.some(
                            (other) => other.key !== promo.key && other.regionId === String(r.id)
                          )
                      );

                      return (
                        <div key={promo.key} className="rounded-lg border bg-muted/30 overflow-hidden">
                          <div className="flex items-center justify-between gap-3 p-3 border-b bg-muted/50">
                            <div className="flex-1 space-y-1 sm:max-w-xs">
                              <label className="text-xs font-medium">Region *</label>
                              <Select
                                value={promo.regionId}
                                onValueChange={(value) => updateDraftPromotion(promo.key, { regionId: value })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRegions.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                      {r.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDraftPromotion(promo.key)}
                              className="text-destructive hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="p-3 space-y-3">
                            <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Free Shipping</span>
                              </div>
                              <Switch
                                checked={promo.freeShipping}
                                onCheckedChange={(checked) =>
                                  updateDraftPromotion(promo.key, { freeShipping: checked })
                                }
                              />
                            </div>

                            <div className="space-y-3 rounded-lg border bg-background p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Gift className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Welcome Offer</span>
                                </div>
                                <Switch
                                  checked={promo.welcomeOfferActive}
                                  onCheckedChange={(checked) =>
                                    updateDraftPromotion(promo.key, { welcomeOfferActive: checked })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Discount %</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={promo.welcomeDiscountPercentage}
                                    onChange={(e) =>
                                      updateDraftPromotion(promo.key, {
                                        welcomeDiscountPercentage: e.target.value,
                                      })
                                    }
                                    placeholder="e.g. 20"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Start</label>
                                  <Input
                                    type="datetime-local"
                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                    value={promo.welcomeOfferStartAt}
                                    onChange={(e) =>
                                      updateDraftPromotion(promo.key, { welcomeOfferStartAt: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">End</label>
                                  <Input
                                    type="datetime-local"
                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                    value={promo.welcomeOfferEndAt}
                                    onChange={(e) =>
                                      updateDraftPromotion(promo.key, { welcomeOfferEndAt: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Translations Tab */}
              <TabsContent value="translations" className="mt-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Language *</label>
                        <Select
                          value={watch(`translations.${index}.languageId`)}
                          onValueChange={(value) => {
                            setValue(`translations.${index}.languageId`, value);
                            setValue(`translations.${index}.categoryId`, "");
                          }}
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
                          value={watch(`translations.${index}.categoryId`) || ""}
                          onValueChange={(value) =>
                            setValue(`translations.${index}.categoryId`, value)
                          }
                          disabled={!watch(`translations.${index}.languageId`)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              ?.filter(
                                (cat) =>
                                  String(cat.language.id) ===
                                  watch(`translations.${index}.languageId`)
                              )
                              .map((cat) => (
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
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <DialogFooter className="gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenForm(false);
                  resetForm();
                }}
                className="sm:mr-auto"
              >
                Cancel
              </Button>
              {!isFirstCreateTab && (
                <Button type="button" variant="outline" onClick={goToPrevCreateTab}>
                  Back
                </Button>
              )}
              {isLastCreateTab ? (
                <Button
                  type="submit"
                  disabled={isUploading || createMutation.isPending || !isTranslationsTabComplete}
                  title={!isTranslationsTabComplete ? "Add an English translation with a title and description first" : undefined}
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
              ) : (
                <Button
                  type="button"
                  onClick={goToNextCreateTab}
                  disabled={!canAdvanceFromCreateTab}
                  title={
                    !canAdvanceFromCreateTab
                      ? createActiveTab === "basic"
                        ? "Enter a valid sort order first"
                        : "A thumbnail is required first"
                      : undefined
                  }
                  className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
                >
                  Next
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
