import { BASE_URL, JWT_TOKEN } from "../categories";

// Types
export type ProductTranslation = {
  id: number;
  productId: number;
  languageId: number;
  categoryId: number;
  title: string;
  description: string;
};

export type CreateProductTranslationInput = {
  productId: number;
  languageId: number;
  categoryId: number;
  title: string;
  description: string;
};

export type UpdateProductTranslationInput = {
  categoryId?: number;
  title?: string;
  description?: string;
};

// Create product translation
export async function createProductTranslation(data: CreateProductTranslationInput): Promise<ProductTranslation> {
  const res = await fetch(`${BASE_URL}/api/product-translations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to create product translation");
  }

  const json = await res.json();
  return json.data.productTranslation;
}

// Update product translation
export async function updateProductTranslation(id: number, data: UpdateProductTranslationInput): Promise<ProductTranslation> {
  const res = await fetch(`${BASE_URL}/api/product-translations/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to update product translation");
  }

  const json = await res.json();
  return json.data.productTranslation;
}

// Delete product translation
export async function deleteProductTranslation(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/product-translations/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.message || "Failed to delete product translation");
  }
}
