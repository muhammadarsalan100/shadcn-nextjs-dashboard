import { BASE_URL, JWT_TOKEN } from "../categories";

// Get all regions
export type Region = {
  id: number;
  name: string;
  pricePercentage: number;
  active: boolean;
};

export async function getRegions(): Promise<Region[]> {
  const res = await fetch(`${BASE_URL}/api/regions/admin`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch regions");

  const json: {
    status: string;
    results: number;
    data: { regions: { id: number; name: string; pricePercentage: string; active: boolean }[] };
  } = await res.json();

  return json.data.regions.map((r) => ({
    ...r,
    pricePercentage: parseFloat(r.pricePercentage),
  }));
}

// Create region
export async function createRegion(data: { name: string; pricePercentage: number }): Promise<Region> {
  const res = await fetch(`${BASE_URL}/api/regions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create region");
  const json = await res.json();
  return json.data as Region;
}

// Update region
export async function updateRegion(id: number, data: { name: string; pricePercentage: number }): Promise<Region> {
  const res = await fetch(`${BASE_URL}/api/regions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update region");
  const json = await res.json();
  return json.data as Region;
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
  if (!res.ok) throw new Error("Failed to delete region");
  return res.json();
}