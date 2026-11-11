import { apiClientJson } from "@/lib/api-client";

export type RegionSummary = {
  id: number;
  name: string;
};

export type Region = {
  id: number;
  name: string;
  currencyCode: string;
  shippingAmount: string;
  bhdToLocalRate: string;
  active: boolean;
};

export type CreateRegionInput = {
  name: string;
  currencyCode: string;
  shippingAmount: number;
  bhdToLocalRate?: number;
};

export type UpdateRegionInput = {
  name?: string;
  currencyCode?: string;
  shippingAmount?: number;
  bhdToLocalRate?: number;
  active?: boolean;
};

// Public region list only includes active regions.
export async function getActiveRegions(): Promise<RegionSummary[]> {
  const json = await apiClientJson<{ data: RegionSummary[] }>("/api/regions", {
    skipAuth: true,
  });
  return json.data;
}

// Admin region list includes active and inactive regions.
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
  const json = await apiClientJson<{ data: { region: Region } }>("/api/regions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data.region;
}

// Update region
export async function updateRegion(id: number, data: UpdateRegionInput): Promise<Region> {
  const json = await apiClientJson<{ data: { region: Region } }>(`/api/regions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data.region;
}

// Delete region
export async function deleteRegion(id: number): Promise<{ message: string }> {
  return apiClientJson<{ message: string }>(`/api/regions/${id}`, {
    method: "DELETE",
  });
}
