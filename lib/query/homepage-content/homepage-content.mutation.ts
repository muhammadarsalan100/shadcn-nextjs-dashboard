import {
  createHomepageBanners,
  updateHomepageBanner,
  deleteHomepageBanner,
  createHomepageCarouselSlides,
  updateHomepageCarouselSlide,
  deleteHomepageCarouselSlide,
  createHomepageGiftCards,
  updateHomepageGiftCard,
  deleteHomepageGiftCard,
  type CreateHomepageBannerInput,
  type UpdateHomepageBannerInput,
  type CreateHomepageMediaInput,
  type UpdateHomepageMediaInput,
} from "@/app/services/homepage-content";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// All homepage-content queries share the "homepage-content" key prefix, so a
// broad invalidate here refreshes the admin view for every region it's cached for.
function useInvalidateHomepageContent() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["homepage-content"] });
}

// ---- Banner ----

export function useCreateHomepageBanner() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: (data: CreateHomepageBannerInput) => createHomepageBanners(data),
    onSuccess: invalidate,
  });
}

export function useUpdateHomepageBanner() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHomepageBannerInput }) =>
      updateHomepageBanner(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteHomepageBanner() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: (id: number) => deleteHomepageBanner(id),
    onSuccess: invalidate,
  });
}

// ---- Carousel slides ----

export function useCreateHomepageCarouselSlide() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: (data: CreateHomepageMediaInput) => createHomepageCarouselSlides(data),
    onSuccess: invalidate,
  });
}

export function useUpdateHomepageCarouselSlide() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHomepageMediaInput }) =>
      updateHomepageCarouselSlide(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteHomepageCarouselSlide() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: (id: number) => deleteHomepageCarouselSlide(id),
    onSuccess: invalidate,
  });
}

// ---- Gift cards ----

export function useCreateHomepageGiftCard() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: (data: CreateHomepageMediaInput) => createHomepageGiftCards(data),
    onSuccess: invalidate,
  });
}

export function useUpdateHomepageGiftCard() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHomepageMediaInput }) =>
      updateHomepageGiftCard(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteHomepageGiftCard() {
  const invalidate = useInvalidateHomepageContent();
  return useMutation({
    mutationFn: (id: number) => deleteHomepageGiftCard(id),
    onSuccess: invalidate,
  });
}
