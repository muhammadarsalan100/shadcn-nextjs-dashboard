import { apiClientJson } from "@/lib/api-client";

// Cloudinary configuration (same project as products/categories, own folder tree)
const CLOUDINARY_CLOUD_NAME = "di0opppiq";
const CLOUDINARY_API_KEY = "867752935459635";
const CLOUDINARY_API_SECRET = "HkMMrDf38-AC04UB6QvKZ674mPc";

export type ImageData = {
  url: string;
  publicId: string;
};

// Generate SHA-1 signature for Cloudinary signed upload
async function generateSignature(params: Record<string, string>): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join("&") + CLOUDINARY_API_SECRET;

  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Upload a homepage content image to Cloudinary (signed upload).
// `folder` should be "homepage/carousel" or "homepage/gift-cards".
export async function uploadHomepageImageToCloudinary(file: File, folder: string): Promise<ImageData> {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const paramsToSign = { folder, timestamp };
  const signature = await generateSignature(paramsToSign);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error?.message || "Failed to upload image to Cloudinary");
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

// ---- Types ----

export type HomepageRegion = {
  id: number;
  name: string;
};

export type HomepageBanner = {
  id: number;
  regionId: number;
  heading: string;
  description: string;
  active: boolean;
};

// Carousel slides and gift cards share the exact same shape
export type HomepageMediaItem = {
  id: number;
  regionId: number;
  heading: string;
  description: string;
  imageUrl: string;
  active: boolean;
};
export type HomepageCarouselSlide = HomepageMediaItem;
export type HomepageGiftCard = HomepageMediaItem;

export type HomepageContentAdmin = {
  region: HomepageRegion;
  banner: HomepageBanner | null;
  carouselSlides: HomepageCarouselSlide[];
  giftCards: HomepageGiftCard[];
};

export type CreateHomepageBannerInput = {
  regionIds: number[];
  heading: string;
  description: string;
  active?: boolean;
};

export type UpdateHomepageBannerInput = {
  heading?: string;
  description?: string;
  active?: boolean;
};

// Shared shape for both carousel-slide and gift-card create/update calls
export type CreateHomepageMediaInput = {
  regionIds: number[];
  heading: string;
  description: string;
  image: ImageData;
  active?: boolean;
};

export type UpdateHomepageMediaInput = {
  heading?: string;
  description?: string;
  image?: ImageData;
  active?: boolean;
};

// ---- Homepage content (admin, read) ----

export async function getHomepageContentAdmin(regionId: number): Promise<HomepageContentAdmin> {
  const json = await apiClientJson<{ data: HomepageContentAdmin }>(
    `/api/homepage-content/admin?regionId=${regionId}`
  );
  return json.data;
}

// ---- Banner ----

export async function createHomepageBanners(data: CreateHomepageBannerInput): Promise<HomepageBanner[]> {
  const json = await apiClientJson<{ data: { banners: HomepageBanner[] } }>(
    "/api/homepage-content/banners",
    { method: "POST", body: JSON.stringify(data) }
  );
  return json.data.banners;
}

export async function updateHomepageBanner(
  id: number,
  data: UpdateHomepageBannerInput
): Promise<HomepageBanner> {
  const json = await apiClientJson<{ data: { banner: HomepageBanner } }>(
    `/api/homepage-content/banners/${id}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  return json.data.banner;
}

export async function deleteHomepageBanner(id: number): Promise<void> {
  await apiClientJson(`/api/homepage-content/banners/${id}`, { method: "DELETE" });
}

// ---- Carousel slides ----

export async function createHomepageCarouselSlides(
  data: CreateHomepageMediaInput
): Promise<HomepageCarouselSlide[]> {
  const json = await apiClientJson<{ data: { carouselSlides: HomepageCarouselSlide[] } }>(
    "/api/homepage-content/carousel-slides",
    { method: "POST", body: JSON.stringify(data) }
  );
  return json.data.carouselSlides;
}

export async function updateHomepageCarouselSlide(
  id: number,
  data: UpdateHomepageMediaInput
): Promise<HomepageCarouselSlide> {
  const json = await apiClientJson<{ data: { carouselSlide: HomepageCarouselSlide } }>(
    `/api/homepage-content/carousel-slides/${id}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  return json.data.carouselSlide;
}

export async function deleteHomepageCarouselSlide(id: number): Promise<void> {
  await apiClientJson(`/api/homepage-content/carousel-slides/${id}`, { method: "DELETE" });
}

// ---- Gift cards ----

export async function createHomepageGiftCards(
  data: CreateHomepageMediaInput
): Promise<HomepageGiftCard[]> {
  const json = await apiClientJson<{ data: { giftCards: HomepageGiftCard[] } }>(
    "/api/homepage-content/gift-cards",
    { method: "POST", body: JSON.stringify(data) }
  );
  return json.data.giftCards;
}

export async function updateHomepageGiftCard(
  id: number,
  data: UpdateHomepageMediaInput
): Promise<HomepageGiftCard> {
  const json = await apiClientJson<{ data: { giftCard: HomepageGiftCard } }>(
    `/api/homepage-content/gift-cards/${id}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  return json.data.giftCard;
}

export async function deleteHomepageGiftCard(id: number): Promise<void> {
  await apiClientJson(`/api/homepage-content/gift-cards/${id}`, { method: "DELETE" });
}
