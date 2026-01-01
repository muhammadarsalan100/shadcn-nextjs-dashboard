import { BASE_URL, JWT_TOKEN } from "../categories";
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
  const res = await fetch(`${BASE_URL}/api/users`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = await res.json();
  return json.data.users as User[];
}

// Toggle active / update role
export async function updateUser(
  id: number,
  data: { active?: boolean; role?: "admin" | "user" }
): Promise<User> {
  const res = await fetch(`${BASE_URL}/api/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  const json = await res.json();
  return json.data as User;
}

// Delete user
export async function deleteUser(id: number): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}
