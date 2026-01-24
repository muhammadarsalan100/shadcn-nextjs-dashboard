import { apiClientJson } from "@/lib/api-client";
import { BASE_URL } from "@/lib/auth";

// Region types
export type Region = {
  id: number;
  name: string;
  currencyCode: string;
  pricePercentage: number;
  conversionRate: number;
  active: boolean;
};

export type CreateRegionInput = {
  name: string;
  currencyCode: string;
  pricePercentage: number;
  conversionRate: number;
};

export type UpdateRegionInput = {
  name?: string;
  currencyCode?: string;
  pricePercentage?: number;
  conversionRate?: number;
  active?: boolean;
};

// Get all regions (admin)
export async function getRegions(): Promise<Region[]> {
  const json = await apiClientJson<{ data: Region[] }>("/api/regions?admin=true");
  return json.data;
}

// Get region by ID
export async function getRegionById(id: number): Promise<Region> {
  const json = await apiClientJson<{ data: Region }>(`/api/regions/${id}`);
  return json.data;
}

// Create region
export async function createRegion(data: CreateRegionInput): Promise<Region> {
  const json = await apiClientJson<{ data: Region }>("/api/regions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}

// Update region
export async function updateRegion(id: number, data: UpdateRegionInput): Promise<Region> {
  const json = await apiClientJson<{ data: Region }>(`/api/regions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data;
}

// Delete region
export async function deleteRegion(id: number): Promise<{ message: string }> {
  return apiClientJson<{ message: string }>(`/api/regions/${id}`, {
    method: "DELETE",
  });
}
