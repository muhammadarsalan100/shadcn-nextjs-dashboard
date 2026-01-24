import { apiClientJson } from "@/lib/api-client";
import { BASE_URL } from "@/lib/auth";

// Language type
export type Language = {
  id: number;
  code: string;
  name: string;
};

// Get all languages
export async function getLanguages(): Promise<Language[]> {
  const json = await apiClientJson<{ data: Language[] }>("/api/languages", {
    skipAuth: true, // Languages endpoint might not require auth
  });
  return json.data;
}

// Create language
export async function createLanguage(data: { code: string; name: string }): Promise<Language> {
  const json = await apiClientJson<{ data: Language }>("/api/languages", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}

// Update language (API only accepts name field)
export async function updateLanguage(id: number, name: string): Promise<Language> {
  const json = await apiClientJson<{ data: Language }>(`/api/languages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  return json.data;
}

// Delete language
export async function deleteLanguage(id: number): Promise<{ message: string }> {
  return apiClientJson<{ message: string }>(`/api/languages/${id}`, {
    method: "DELETE",
  });
}
