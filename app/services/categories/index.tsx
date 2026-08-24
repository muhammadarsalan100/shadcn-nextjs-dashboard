import { apiClientJson } from "@/lib/api-client";

// Cloudinary configuration (same project as products, separate folder)
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

// Upload a category image to Cloudinary (signed upload)
export async function uploadCategoryImageToCloudinary(file: File): Promise<ImageData> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "categories";

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

// Category types
export type CategoryLanguage = {
  id: number;
  name: string;
  code: string;
};

export type Category = {
  id: number;
  name: string;
  imageUrl?: string | null;
  language: CategoryLanguage;
};

// Full category record returned by the admin get-by-id endpoint (includes the Cloudinary public ID)
export type CategoryDetails = Category & {
  imagePublicId: string | null;
};

// Both create and update take the Cloudinary result as a nested object
// (matching the product "thumbnail" convention) — the GET responses are
// what use the flat imageUrl/imagePublicId field names, not the writes.
export type CreateCategoryInput = {
  name: string;
  languageId: number;
  image?: ImageData | null;
};

export type UpdateCategoryInput = {
  name?: string;
  languageId?: number;
  image?: ImageData | null;
};

// Create category
export async function createCategory(data: CreateCategoryInput): Promise<Category> {
  const json = await apiClientJson<{ data: Category }>("/api/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}

// Get all categories (with optional language filter)
export async function getCategories(lang?: string): Promise<Category[]> {
  const url = lang
    ? `/api/categories?lang=${encodeURIComponent(lang)}`
    : `/api/categories`;

  const json = await apiClientJson<{ data: Category[] }>(url);
  return json.data;
}

// Get a single category by ID (admin) — includes the Cloudinary public ID
export async function getCategoryById(id: number): Promise<CategoryDetails> {
  const json = await apiClientJson<{ data: CategoryDetails }>(`/api/categories/${id}`);
  return json.data;
}

// Delete category
export async function deleteCategory(id: number) {
  return apiClientJson(`/api/categories/${id}`, {
    method: "DELETE",
  });
}

// Update category
export async function updateCategory(id: number, data: UpdateCategoryInput): Promise<Category> {
  const json = await apiClientJson<{ data: Category }>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data;
}
