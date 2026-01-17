import { BASE_URL, JWT_TOKEN } from "../categories";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "di0opppiq";
const CLOUDINARY_API_KEY = "867752935459635";
const CLOUDINARY_API_SECRET = "HkMMrDf38-AC04UB6QvKZ674mPc";

// Types
export type ImageData = {
  url: string;
  publicId: string;
};

export type ProductSize = {
  size: string | null;
  stock: number;
  price: number;
};

export type ProductTranslation = {
  languageId: number;
  categoryId: number;
  title: string;
  description: string;
};

export type CreateProductInput = {
  discountPercentage?: number;
  perfumeType: "male" | "female" | "unisex";
  thumbnail: ImageData;
  images?: ImageData[];
  sizes: ProductSize[];
  translations: ProductTranslation[];
};

export type CreateProductResponse = {
  status: string;
  data: {
    productId: number;
  };
};

// Generate SHA-1 signature for Cloudinary signed upload
async function generateSignature(params: Record<string, string>): Promise<string> {
  // Sort parameters alphabetically and create string to sign
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join("&") + CLOUDINARY_API_SECRET;
  
  // Generate SHA-1 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Upload image to Cloudinary (signed upload)
export async function uploadToCloudinary(file: File): Promise<ImageData> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "products";
  
  // Parameters to sign (alphabetically sorted for signature)
  const paramsToSign = {
    folder,
    timestamp,
  };
  
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

// Upload multiple images to Cloudinary
export async function uploadMultipleToCloudinary(files: File[]): Promise<ImageData[]> {
  const uploadPromises = files.map((file) => uploadToCloudinary(file));
  return Promise.all(uploadPromises);
}

// Create product
export async function createProduct(data: CreateProductInput): Promise<CreateProductResponse> {
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create product");
  }

  return res.json();
}

// Product type from admin endpoint
export type Product = {
  id: number;
  title: string | null;
  description: string | null;
  price: string;
  discountPercentage: string;
  inStock: boolean;
  active: boolean;
  thumbnailUrl?: string;
  sizes?: {
    id: number;
    size: string;
    stock: number;
    price: string;
  }[];
};

// Get all products (admin endpoint - returns English translations, ordered by newest)
export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/api/products/admin`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch products");
  }

  const json = await res.json();
  return json.data;
}

// Full product details type (from admin endpoint)
export type ProductDetails = {
  id: number;
  perfumeType: "male" | "female" | "unisex";
  discountPercentage: string;
  thumbnailUrl: string | null;
  thumbnailPublicId: string | null;
  image1Url: string | null;
  image1PublicId: string | null;
  image2Url: string | null;
  image2PublicId: string | null;
  image3Url: string | null;
  image3PublicId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  translations: {
    id: number;
    title: string;
    description: string;
    category: {
      id: number;
      name: string;
    };
    language: {
      id: number;
      name: string;
      code: string;
    };
  }[];
  sizes: {
    id: number;
    size: string;
    stock: number;
    price: string;
  }[];
};

// Get single product by ID (admin endpoint with full details)
export async function getProduct(id: number): Promise<ProductDetails> {
  const res = await fetch(`${BASE_URL}/api/products/admin/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch product");
  }

  const json = await res.json();
  return json.data;
}

// Delete product
export async function deleteProduct(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/api/products/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to delete product");
  }

  return res.json();
}

// Update product input type
export type UpdateProductInput = {
  perfumeType?: "male" | "female" | "unisex";
  discountPercentage?: number;
  active?: boolean;
  thumbnailUrl?: string | null;
  thumbnailPublicId?: string | null;
  image1Url?: string | null;
  image1PublicId?: string | null;
  image2Url?: string | null;
  image2PublicId?: string | null;
  image3Url?: string | null;
  image3PublicId?: string | null;
};

// Update product
export async function updateProduct(id: number, data: UpdateProductInput): Promise<Product> {
  const res = await fetch(`${BASE_URL}/api/products/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to update product");
  }

  const json = await res.json();
  return json.data.product;
}
