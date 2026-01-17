export const BASE_URL = 'https://ramik-backend.onrender.com';

// Your JWT token
export const JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc2ODY0MDIzOSwiZXhwIjoxNzY4NzI2NjM5fQ.mlDXUVjSXgHrXRlXBrxNAx8_XH2amwZLh_1h-xdMxw8";

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
  const res = await fetch(`${BASE_URL}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create category");
  }

  const json = await res.json();
  return json.data;
}

// Get all categories (with optional language filter)
export async function getCategories(lang?: string): Promise<Category[]> {
  const url = lang 
    ? `${BASE_URL}/api/categories?lang=${encodeURIComponent(lang)}`
    : `${BASE_URL}/api/categories`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch categories");
  }

  const json = await res.json();
  return json.data;
}

// Delete category
export async function deleteCategory(id: number) {
  const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to delete category");
  }

  return res.json();
}

// Update category
export async function updateCategory(id: number, data: UpdateCategoryInput): Promise<Category> {
  const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update category");
  }

  const json = await res.json();
  return json.data;
}
