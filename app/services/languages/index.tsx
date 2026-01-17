import { BASE_URL, JWT_TOKEN } from "../categories";

// Language type
export type Language = {
  id: number;
  code: string;
  name: string;
};

// Get all languages
export async function getLanguages(): Promise<Language[]> {
  const res = await fetch(`${BASE_URL}/api/languages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch languages");
  }

  const json = await res.json();
  return json.data;
}

// Create language
export async function createLanguage(data: { code: string; name: string }): Promise<Language> {
  const res = await fetch(`${BASE_URL}/api/languages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create language");
  }

  const json = await res.json();
  return json.data as Language;
}

// Update language (API only accepts name field)
export async function updateLanguage(id: number, name: string): Promise<Language> {
  const res = await fetch(`${BASE_URL}/api/languages/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update language");
  }

  const json = await res.json();
  return json.data as Language;
}

// Delete language
export async function deleteLanguage(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/api/languages/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to delete language");
  }

  return res.json();
}
