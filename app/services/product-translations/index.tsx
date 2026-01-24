import { apiClientJson } from "@/lib/api-client";

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
  const json = await apiClientJson<{ data: { productTranslation: ProductTranslation } }>("/api/product-translations", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data.productTranslation;
}

// Update product translation
export async function updateProductTranslation(id: number, data: UpdateProductTranslationInput): Promise<ProductTranslation> {
  const json = await apiClientJson<{ data: { productTranslation: ProductTranslation } }>(`/api/product-translations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data.productTranslation;
}

// Delete product translation
export async function deleteProductTranslation(id: number): Promise<void> {
  await apiClientJson(`/api/product-translations/${id}`, {
    method: "DELETE",
  });
}
