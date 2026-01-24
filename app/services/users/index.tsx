import { apiClientJson } from "@/lib/api-client";
export type User = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  role: "admin" | "user";
  active: boolean;
  region: string | null;
};

// Get all users
export async function getUsers(): Promise<User[]> {
  const json = await apiClientJson<{ data: { users: User[] } }>("/api/users");
  return json.data.users;
}

// Toggle active / update role
export async function updateUser(
  id: number,
  data: { active?: boolean; role?: "admin" | "user" }
): Promise<User> {
  const json = await apiClientJson<{ data: User }>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data;
}

// Delete user
export async function deleteUser(id: number): Promise<{ message: string }> {
  return apiClientJson<{ message: string }>(`/api/users/${id}`, {
    method: "DELETE",
  });
}
