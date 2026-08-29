"use client";

import { useState, useRef } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Megaphone,
  GalleryHorizontal,
  Gift,
  Plus,
  Pencil,
  Trash2,
  X,
  ImagePlus,
  Loader2,
  ChevronDown,
  MapPin,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useRegions } from "@/lib/query/region/region.query";
import { useAllHomepageContent } from "@/lib/query/homepage-content/homepage-content.query";
import {
  useCreateHomepageBanner,
  useUpdateHomepageBanner,
  useDeleteHomepageBanner,
  useCreateHomepageCarouselSlide,
  useUpdateHomepageCarouselSlide,
  useDeleteHomepageCarouselSlide,
  useCreateHomepageGiftCard,
  useUpdateHomepageGiftCard,
  useDeleteHomepageGiftCard,
} from "@/lib/query/homepage-content/homepage-content.mutation";
import {
  uploadHomepageImageToCloudinary,
  type HomepageBanner,
  type HomepageMediaItem,
  type CreateHomepageMediaInput,
  type UpdateHomepageMediaInput,
} from "@/app/services/homepage-content";
import type { Region } from "@/app/services/region";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (Cloudinary limit)

type MediaCreateMutation = UseMutationResult<HomepageMediaItem[], Error, CreateHomepageMediaInput>;
type MediaUpdateMutation = UseMutationResult<
  HomepageMediaItem,
  Error,
  { id: number; data: UpdateHomepageMediaInput }
>;
type MediaDeleteMutation = UseMutationResult<void, Error, number>;

// A proper multi-select for regions: a dropdown of checkboxes (stays open
// while toggling), plus removable chips underneath showing the current pick.
function RegionMultiSelect({
  regions,
  selectedIds,
  onChange,
  placeholder = "Select regions",
}: {
  regions: Region[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}) {
  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((r) => r !== id) : [...selectedIds, id]);
  };
  const selected = regions.filter((r) => selectedIds.includes(r.id));

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between font-normal">
            <span className={`flex items-center gap-1.5 truncate ${selected.length === 0 ? "text-muted-foreground" : ""}`}>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {selected.length === 0
                ? placeholder
                : `${selected.length} region${selected.length === 1 ? "" : "s"} selected`}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
        >
          {regions.map((r) => (
            <DropdownMenuCheckboxItem
              key={r.id}
              checked={selectedIds.includes(r.id)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => toggle(r.id)}
            >
              {r.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((r) => (
            <Badge key={r.id} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
              {r.name}
              <button
                type="button"
                onClick={() => toggle(r.id)}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Shared list section for Carousel Slides and Gift Cards — identical shape
// (heading, description, image, active), just different labels/minimums/folders.
function HomepageMediaSection({
  icon: Icon,
  title,
  description,
  itemNoun,
  items,
  minActive,
  uploadFolder,
  regions,
  createMutation,
  updateMutation,
  deleteMutation,
}: {
  icon: typeof GalleryHorizontal;
  title: string;
  description: string;
  itemNoun: string;
  items: HomepageMediaItem[];
  minActive: number;
  uploadFolder: string;
  regions: Region[];
  createMutation: MediaCreateMutation;
  updateMutation: MediaUpdateMutation;
  deleteMutation: MediaDeleteMutation;
}) {
  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addRegionIds, setAddRegionIds] = useState<number[]>([]);
  const [addHeading, setAddHeading] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addActive, setAddActive] = useState(true);
  const [isUploadingAdd, setIsUploadingAdd] = useState(false);
  const addImageRef = useRef<HTMLInputElement>(null);
  // Set when the add form was opened via "Duplicate" on an existing item, so
  // we can pre-fill its text and show a hint that the image must be re-uploaded
  // (the region can't be changed on the original, and the API never returns
  // its Cloudinary public ID, so the image can't be copied automatically).
  const [duplicatingFrom, setDuplicatingFrom] = useState<HomepageMediaItem | null>(null);

  // Edit state (one item at a time)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editHeading, setEditHeading] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editActive, setEditActive] = useState(true);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);
  const editImageRef = useRef<HTMLInputElement>(null);

  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const resetAddForm = () => {
    setShowAddForm(false);
    setAddRegionIds([]);
    setAddHeading("");
    setAddDescription("");
    setAddImageFile(null);
    setAddImagePreview(null);
    setAddActive(true);
    setDuplicatingFrom(null);
    if (addImageRef.current) addImageRef.current.value = "";
  };

  const handleDuplicateClick = (item: HomepageMediaItem) => {
    setDuplicatingFrom(item);
    setShowAddForm(true);
    setAddRegionIds([]);
    setAddHeading(item.heading);
    setAddDescription(item.description);
    setAddImageFile(null);
    // Show the original as the preview — it's what will be copied unless the
    // admin clears it and uploads a different one instead (see handleCreate).
    setAddImagePreview(item.imageUrl);
    setAddActive(item.active);
    // Clear the native file input too — otherwise a stale selection lingers,
    // and re-picking that same file afterward won't fire onChange at all.
    if (addImageRef.current) addImageRef.current.value = "";
  };

  // True while the add form is still showing the duplicated item's original
  // image untouched — i.e. no new file was picked and the preview wasn't cleared.
  const usingDuplicateSourceImage =
    !!duplicatingFrom && !addImageFile && addImagePreview === duplicatingFrom.imageUrl;

  const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`);
      e.target.value = "";
      return;
    }
    setAddImageFile(file);
    setAddImagePreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (addRegionIds.length === 0) {
      toast.error("Select at least one region");
      return;
    }
    if (!addHeading.trim() || !addDescription.trim()) {
      toast.error("Heading and description are required");
      return;
    }
    if (!addImageFile && !usingDuplicateSourceImage) {
      toast.error("An image is required");
      return;
    }

    try {
      setIsUploadingAdd(true);
      let image: { url: string; publicId: string };
      if (addImageFile) {
        image = await uploadHomepageImageToCloudinary(addImageFile, uploadFolder);
      } else {
        // Reusing the duplicated item's image: Cloudinary never gives us its
        // public ID back, so we fetch the (public) URL and re-upload the same
        // bytes as a fresh asset rather than asking the admin to do it by hand.
        const sourceRes = await fetch(duplicatingFrom!.imageUrl);
        if (!sourceRes.ok) throw new Error("Failed to fetch the original image for duplication");
        const blob = await sourceRes.blob();
        const file = new File([blob], "duplicate.jpg", { type: blob.type || "image/jpeg" });
        image = await uploadHomepageImageToCloudinary(file, uploadFolder);
      }
      await createMutation.mutateAsync({
        regionIds: addRegionIds,
        heading: addHeading,
        description: addDescription,
        image,
        active: addActive,
      });
      toast.success(`${itemNoun} added`);
      resetAddForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to add ${itemNoun.toLowerCase()}`);
    } finally {
      setIsUploadingAdd(false);
    }
  };

  const handleEditClick = (item: HomepageMediaItem) => {
    setEditingId(item.id);
    setEditHeading(item.heading);
    setEditDescription(item.description);
    setEditImageFile(null);
    setEditImagePreview(item.imageUrl);
    setEditActive(item.active);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditHeading("");
    setEditDescription("");
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditActive(true);
    if (editImageRef.current) editImageRef.current.value = "";
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`);
      e.target.value = "";
      return;
    }
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleUpdate = async () => {
    if (editingId == null) return;

    const current = items.find((i) => i.id === editingId);
    if (current?.active && !editActive) {
      const regionActiveCount = items.filter((i) => i.regionId === current.regionId && i.active).length;
      if (regionActiveCount <= minActive) {
        toast.error(`At least ${minActive} active ${itemNoun.toLowerCase()}s are required for this region.`);
        return;
      }
    }

    try {
      let image: { url: string; publicId: string } | undefined;
      if (editImageFile) {
        setIsUploadingEdit(true);
        image = await uploadHomepageImageToCloudinary(editImageFile, uploadFolder);
      }
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          heading: editHeading,
          description: editDescription,
          active: editActive,
          ...(image ? { image } : {}),
        },
      });
      toast.success(`${itemNoun} updated`);
      handleCancelEdit();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to update ${itemNoun.toLowerCase()}`);
    } finally {
      setIsUploadingEdit(false);
    }
  };

  const confirmDeleteItem = () => {
    if (itemToDelete == null) return;
    const current = items.find((i) => i.id === itemToDelete);
    if (current?.active) {
      const regionActiveCount = items.filter((i) => i.regionId === current.regionId && i.active).length;
      if (regionActiveCount <= minActive) {
        toast.error(`At least ${minActive} active ${itemNoun.toLowerCase()}s are required for this region.`);
        return;
      }
    }
    deleteMutation.mutate(itemToDelete, {
      onSuccess: () => {
        toast.success(`${itemNoun} removed`);
        setItemToDelete(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : `Failed to remove ${itemNoun.toLowerCase()}`);
      },
    });
  };

  const itemPendingDelete = items.find((i) => i.id === itemToDelete);

  // When duplicating, don't offer the region the item is already in —
  // re-adding it there would just create a redundant duplicate in place.
  const availableRegionsForAdd = duplicatingFrom
    ? regions.filter((r) => r.id !== duplicatingFrom.regionId)
    : regions;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setDuplicatingFrom(null);
              setShowAddForm((prev) => !prev);
            }}
            className="gap-1 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4" />
            Add {itemNoun}
          </Button>
        </div>
        <p className="pt-1 text-xs text-muted-foreground">
          {items.length} total across all regions · at least {minActive} active {itemNoun.toLowerCase()}s required per region
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-4 space-y-3">
              {duplicatingFrom && (
                <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  Duplicating <span className="font-medium text-foreground">&quot;{duplicatingFrom.heading}&quot;</span> —
                  its image will be copied automatically. Just pick the region(s) to add it to, or clear the image
                  below to upload a different one.
                </p>
              )}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Regions *</Label>
                <RegionMultiSelect
                  regions={availableRegionsForAdd}
                  selectedIds={addRegionIds}
                  onChange={setAddRegionIds}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Image *</Label>
                <div className="flex items-start gap-3">
                  {addImagePreview ? (
                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={addImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      {usingDuplicateSourceImage && (
                        <Badge variant="outline" className="absolute bottom-1 left-1 text-[9px] bg-background/80">
                          Original
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAddImageFile(null);
                          setAddImagePreview(null);
                          if (addImageRef.current) addImageRef.current.value = "";
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addImageRef.current?.click()}
                      className="w-32 aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 hover:border-amber-500 hover:bg-amber-500/5 transition-colors"
                    >
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload</span>
                    </button>
                  )}
                  <input
                    ref={addImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAddImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Heading *</Label>
                <Input
                  value={addHeading}
                  onChange={(e) => setAddHeading(e.target.value)}
                  placeholder="e.g. Luxury Fragrances"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Description *</Label>
                <Textarea
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="e.g. Discover our premium perfume collection."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={addActive} onCheckedChange={setAddActive} />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={resetAddForm}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={isUploadingAdd || createMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUploadingAdd || createMutation.isPending ? (
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

        {regions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No regions configured yet.</p>
        ) : (
          <div className="space-y-4">
            {(() => {
              const regionsWithItems = regions.filter((r) => items.some((i) => i.regionId === r.id));
              const regionsWithoutItems = regions.filter((r) => !items.some((i) => i.regionId === r.id));
              return (
                <>
                  {regionsWithoutItems.length > 0 && (
                    <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">No {itemNoun.toLowerCase()}s yet:</span>{" "}
                      {regionsWithoutItems.map((r) => r.name).join(", ")}
                    </p>
                  )}

                  {regionsWithItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No {itemNoun.toLowerCase()}s added yet. Click &quot;Add {itemNoun}&quot; above to add one.
                      </p>
                    </div>
                  )}

                  <div className="space-y-5">
                    {regionsWithItems.map((region) => {
                      const regionItems = items.filter((i) => i.regionId === region.id);
                      const regionActiveCount = regionItems.filter((i) => i.active).length;
                      return (
                        <div key={region.id} className="rounded-lg border overflow-hidden">
                          <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{region.name}</span>
                            <Badge
                              variant={regionActiveCount >= minActive ? "outline" : "destructive"}
                              className="ml-auto text-[10px]"
                            >
                              {regionActiveCount} active
                            </Badge>
                          </div>

                          <div className="divide-y">
                            {regionItems.map((item) => (
                              <div key={item.id} className={`p-3 ${item.active ? "" : "bg-muted/20"}`}>
                                {editingId === item.id ? (
                                  <div className="space-y-2">
                                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden border">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={editImagePreview ?? ""}
                                        alt={editHeading}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => editImageRef.current?.click()}
                                        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-black/80 py-1 text-[10px] font-semibold text-white"
                                      >
                                        <ImagePlus className="h-3 w-3" />
                                        Change
                                      </button>
                                      <input
                                        ref={editImageRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageChange}
                                        className="hidden"
                                      />
                                    </div>
                                    <Input
                                      value={editHeading}
                                      onChange={(e) => setEditHeading(e.target.value)}
                                      className="h-8"
                                      placeholder="Heading"
                                    />
                                    <Textarea
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      rows={2}
                                      placeholder="Description"
                                    />
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Switch checked={editActive} onCheckedChange={setEditActive} />
                                        <span className="text-xs text-muted-foreground">Active</span>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCancelEdit}>
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                          onClick={handleUpdate}
                                          disabled={isUploadingEdit || updateMutation.isPending}
                                        >
                                          {isUploadingEdit || updateMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            "Save"
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className="relative h-14 w-24 shrink-0 rounded-md overflow-hidden border">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={item.imageUrl}
                                        alt={item.heading}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate" title={item.heading}>
                                          {item.heading}
                                        </p>
                                        {!item.active && (
                                          <Badge variant="outline" className="shrink-0 text-[10px]">
                                            Inactive
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        title="Duplicate to other regions"
                                        onClick={() => handleDuplicateClick(item)}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        title="Edit"
                                        onClick={() => handleEditClick(item)}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        title="Delete"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setItemToDelete(item.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      <Dialog open={itemToDelete != null} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to remove this {itemNoun.toLowerCase()}
            {itemPendingDelete ? ` ("${itemPendingDelete.heading}")` : ""}? This action cannot be undone.
          </p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setItemToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteItem} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function HomepageContentPage() {
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const regionIds = regions?.map((r) => r.id) ?? [];
  const { data: contentList, isLoading: contentLoading, isError } = useAllHomepageContent(regionIds);
  const isLoading = regionsLoading || contentLoading;

  const allBanners = contentList.flatMap((c) => (c.banner ? [c.banner] : []));
  const allSlides = contentList.flatMap((c) => c.carouselSlides);
  const allGiftCards = contentList.flatMap((c) => c.giftCards);

  const createBannerMutation = useCreateHomepageBanner();
  const updateBannerMutation = useUpdateHomepageBanner();
  const deleteBannerMutation = useDeleteHomepageBanner();

  const createSlideMutation = useCreateHomepageCarouselSlide();
  const updateSlideMutation = useUpdateHomepageCarouselSlide();
  const deleteSlideMutation = useDeleteHomepageCarouselSlide();

  const createGiftCardMutation = useCreateHomepageGiftCard();
  const updateGiftCardMutation = useUpdateHomepageGiftCard();
  const deleteGiftCardMutation = useDeleteHomepageGiftCard();

  // Banner (one per region) state — a region can only have one, so the add
  // form only offers regions that don't already have a banner.
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [bannerRegionIds, setBannerRegionIds] = useState<number[]>([]);
  const [bannerHeading, setBannerHeading] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [bannerActive, setBannerActive] = useState(true);

  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [editBannerHeading, setEditBannerHeading] = useState("");
  const [editBannerDescription, setEditBannerDescription] = useState("");
  const [editBannerActive, setEditBannerActive] = useState(true);

  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);

  const regionsWithoutBanner = (regions ?? []).filter(
    (r) => !allBanners.some((b) => b.regionId === r.id)
  );

  const resetAddBannerForm = () => {
    setShowAddBanner(false);
    setBannerRegionIds([]);
    setBannerHeading("");
    setBannerDescription("");
    setBannerActive(true);
  };

  const handleCreateBanner = () => {
    if (bannerRegionIds.length === 0) {
      toast.error("Select at least one region");
      return;
    }
    if (!bannerHeading.trim() || !bannerDescription.trim()) {
      toast.error("Heading and description are required");
      return;
    }
    createBannerMutation.mutate(
      {
        regionIds: bannerRegionIds,
        heading: bannerHeading,
        description: bannerDescription,
        active: bannerActive,
      },
      {
        onSuccess: () => {
          toast.success("Banner added");
          resetAddBannerForm();
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to add banner"),
      }
    );
  };

  const handleEditBannerClick = (banner: HomepageBanner) => {
    setEditingBannerId(banner.id);
    setEditBannerHeading(banner.heading);
    setEditBannerDescription(banner.description);
    setEditBannerActive(banner.active);
  };

  const handleCancelEditBanner = () => {
    setEditingBannerId(null);
    setEditBannerHeading("");
    setEditBannerDescription("");
    setEditBannerActive(true);
  };

  const handleUpdateBanner = () => {
    if (editingBannerId == null) return;
    updateBannerMutation.mutate(
      {
        id: editingBannerId,
        data: {
          heading: editBannerHeading,
          description: editBannerDescription,
          active: editBannerActive,
        },
      },
      {
        onSuccess: () => {
          toast.success("Banner updated");
          handleCancelEditBanner();
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update banner"),
      }
    );
  };

  const confirmDeleteBanner = () => {
    if (bannerToDelete == null) return;
    deleteBannerMutation.mutate(bannerToDelete, {
      onSuccess: () => {
        toast.success("Banner removed");
        setBannerToDelete(null);
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to remove banner"),
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
          Homepage Content
        </h2>
        <p className="text-muted-foreground">
          Manage the announcement banner, hero carousel, and gift cards shown on the storefront, per region.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : isError ? (
        <p className="text-center text-destructive py-8">Failed to load homepage content.</p>
      ) : (
        <div className="space-y-6">
          {/* Announcement Banner */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Announcement Banner
                  </CardTitle>
                  <CardDescription>One banner per region, shown at the top of the storefront.</CardDescription>
                </div>
                {!showAddBanner && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddBanner(true)}
                    disabled={regionsWithoutBanner.length === 0}
                    title={regionsWithoutBanner.length === 0 ? "Every region already has a banner" : undefined}
                    className="gap-1 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600"
                  >
                    <Plus className="h-4 w-4" />
                    Add Banner
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddBanner && (
                <div className="space-y-3 rounded-lg border border-amber-500/50 bg-amber-500/5 p-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Regions *</Label>
                    <RegionMultiSelect
                      regions={regionsWithoutBanner}
                      selectedIds={bannerRegionIds}
                      onChange={setBannerRegionIds}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Heading *</Label>
                    <Input
                      value={bannerHeading}
                      onChange={(e) => setBannerHeading(e.target.value)}
                      placeholder="e.g. Discover Your Signature Scent"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Description *</Label>
                    <Textarea
                      value={bannerDescription}
                      onChange={(e) => setBannerDescription(e.target.value)}
                      placeholder="e.g. Explore fragrances selected for every occasion."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={bannerActive} onCheckedChange={setBannerActive} />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={resetAddBannerForm}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateBanner}
                        disabled={createBannerMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {createBannerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {allBanners.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allBanners.map((banner) => {
                    const regionName =
                      regions?.find((r) => r.id === banner.regionId)?.name ?? `Region #${banner.regionId}`;
                    return (
                      <Card key={banner.id} className={banner.active ? "" : "opacity-70"}>
                        <CardContent className="pt-4 space-y-2">
                          {editingBannerId === banner.id ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {regionName}
                              </div>
                              <Input
                                value={editBannerHeading}
                                onChange={(e) => setEditBannerHeading(e.target.value)}
                                className="h-8"
                                placeholder="Heading"
                              />
                              <Textarea
                                value={editBannerDescription}
                                onChange={(e) => setEditBannerDescription(e.target.value)}
                                rows={2}
                                placeholder="Description"
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Switch checked={editBannerActive} onCheckedChange={setEditBannerActive} />
                                  <span className="text-xs text-muted-foreground">Active</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCancelEditBanner}>
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                    onClick={handleUpdateBanner}
                                    disabled={updateBannerMutation.isPending}
                                  >
                                    {updateBannerMutation.isPending ? (
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
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" /> {regionName}
                                </div>
                                <Badge variant={banner.active ? "default" : "outline"} className="text-[10px]">
                                  {banner.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm">{banner.heading}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{banner.description}</p>
                              <div className="flex justify-end gap-1 pt-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleEditBannerClick(banner)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-destructive hover:text-destructive"
                                  onClick={() => setBannerToDelete(banner.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                !showAddBanner && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Megaphone className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No banners configured yet. Click &quot;Add Banner&quot; above to add one.
                    </p>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Hero Carousel */}
          <HomepageMediaSection
            icon={GalleryHorizontal}
            title="Hero Carousel"
            description="Slides shown in the homepage hero carousel."
            itemNoun="Slide"
            items={allSlides}
            minActive={3}
            uploadFolder="homepage/carousel"
            regions={regions ?? []}
            createMutation={createSlideMutation}
            updateMutation={updateSlideMutation}
            deleteMutation={deleteSlideMutation}
          />

          <Separator />

          {/* Gift Cards */}
          <HomepageMediaSection
            icon={Gift}
            title="Gift Cards"
            description="Promotional gift-card tiles shown on the homepage."
            itemNoun="Gift Card"
            items={allGiftCards}
            minActive={2}
            uploadFolder="homepage/gift-cards"
            regions={regions ?? []}
            createMutation={createGiftCardMutation}
            updateMutation={updateGiftCardMutation}
            deleteMutation={deleteGiftCardMutation}
          />
        </div>
      )}

      {/* Delete Banner Confirmation */}
      <Dialog open={bannerToDelete != null} onOpenChange={(open) => !open && setBannerToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to remove this banner? This action cannot be undone.</p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBannerToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBanner} disabled={deleteBannerMutation.isPending}>
              {deleteBannerMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
