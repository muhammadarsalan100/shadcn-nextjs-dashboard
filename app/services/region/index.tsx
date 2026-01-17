import { BASE_URL, JWT_TOKEN } from "../categories";

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
  const res = await fetch(`${BASE_URL}/api/regions?admin=true`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch regions");
  }

  const json = await res.json();
  return json.data;
}

// Get region by ID
export async function getRegionById(id: number): Promise<Region> {
  const res = await fetch(`${BASE_URL}/api/regions/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch region");
  }

  const json = await res.json();
  return json.data;
}

// Create region
export async function createRegion(data: CreateRegionInput): Promise<Region> {
  const res = await fetch(`${BASE_URL}/api/regions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create region");
  }

  const json = await res.json();
  return json.data;
}

// Update region
export async function updateRegion(id: number, data: UpdateRegionInput): Promise<Region> {
  const res = await fetch(`${BASE_URL}/api/regions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update region");
  }

  const json = await res.json();
  return json.data;
}

// Delete region
export async function deleteRegion(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/api/regions/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to delete region");
  }

  return res.json();
}
