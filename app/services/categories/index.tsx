export const BASE_URL = 'https://ramik-backend.onrender.com';

// Your JWT token
export const JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc2NzI3NjYyNSwiZXhwIjoxNzY3MzYzMDI1fQ.JxqzDPQNSxjgx9LCvJXRn5XhFyjIDn5qcy56kT-NpaE";

export async function createCategory(category: string) {
  const res = await fetch(`${BASE_URL}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`, // <-- JWT added here
    },
    body: JSON.stringify({ name:category }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create category");
  }

  return res.json();
}

export async function getCategories(): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`${BASE_URL}/api/categories`, {
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
  return json.data; // extract data array
}
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

export async function updateCategory(id: number, name: string) {
  const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
}