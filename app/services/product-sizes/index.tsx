import { BASE_URL, JWT_TOKEN } from "../categories";

// Types
export type ProductSize = {
  id: number;
  productId: number;
  size: string;
  stock: number;
  price: string;
};

// Get product sizes by product ID
export async function getProductSizes(productId: number): Promise<ProductSize[]> {
  // Fetch product sizes from the product-sizes endpoint
  const res = await fetch(`${BASE_URL}/api/product-sizes?productId=${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to fetch product sizes");
  }

  const json = await res.json();
  return json.data || [];
}

export type CreateProductSizeInput = {
  productId: number;
  size: string;
  stock: number;
  price: number;
};

export type UpdateProductSizeInput = {
  size?: string;
  stock?: number;
  price?: number;
};

// Create product size
export async function createProductSize(data: CreateProductSizeInput): Promise<ProductSize> {
  const res = await fetch(`${BASE_URL}/api/product-sizes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to create product size");
  }

  const json = await res.json();
  return json.data.productSize;
}

// Update product size
export async function updateProductSize(id: number, data: UpdateProductSizeInput): Promise<ProductSize> {
  const res = await fetch(`${BASE_URL}/api/product-sizes/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to update product size");
  }

  const json = await res.json();
  return json.data.productSize;
}

// Delete product size
export async function deleteProductSize(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/product-sizes/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to delete product size");
  }
}
