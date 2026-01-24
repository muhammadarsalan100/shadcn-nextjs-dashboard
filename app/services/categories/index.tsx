import { apiClientJson } from "@/lib/api-client";

// Re-export BASE_URL for backward compatibility
export { BASE_URL } from "@/lib/auth";

// Category types
export type CategoryLanguage = {
  id: number;
  name: string;
  code: string;
};

export type Category = {
  id: number;
  name: string;
  language: CategoryLanguage;
};

export type CreateCategoryInput = {
  name: string;
  languageId: number;
};

export type UpdateCategoryInput = {
  name?: string;
  languageId?: number;
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
