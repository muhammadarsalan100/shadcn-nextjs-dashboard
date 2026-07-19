import { apiClientJson } from "@/lib/api-client";

export type OrderStatus =
  | "CONFIRM"
  | "PROCESSING"
  | "CUSTOM_CLEARANCE"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

export const ORDER_STATUSES: OrderStatus[] = [
  "CONFIRM",
  "PROCESSING",
  "CUSTOM_CLEARANCE",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
];

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "COD";

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "COD",
];

export type UpdateOrderInput = {
  status?: string;
  paymentStatus?: string;
  shippingAddress?: string;
  country?: string;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
};

export type OrderItem = {
  id: number;
  productName: string;
  size: string;
  quantity: number;
  price: string | number;
  discountPercentage: string | number;
  finalPrice: string | number;
  thumbnailUrl?: string | null;
};

export type Order = {
  id: number;
  orderNumber: string;
  country: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  subtotal: string | number;
  discountAmount: string | number;
  shippingAmount: string | number;
  totalAmount: string | number;
  currency: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
};

export type GetOrdersParams = {
  status?: string;
};

// Get all orders (admin)
export async function getOrders(params?: GetOrdersParams): Promise<Order[]> {
  const query = new URLSearchParams();
  if (params?.status) {
    query.set("status", params.status);
  }

  const endpoint = `/api/orders/admin${query.toString() ? `?${query.toString()}` : ""}`;
  const json = await apiClientJson<{ data: Order[] }>(endpoint);
  return json.data;
}

// Update an order (admin) — at least one supported field required
export async function updateOrder(
  id: number,
  data: UpdateOrderInput
): Promise<Order> {
  const json = await apiClientJson<{ status: string; data: Order }>(
    `/api/orders/admin/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  return json.data;
}

// Permanently delete an order (admin)
export async function deleteOrder(
  id: number
): Promise<{ status?: string; message?: string }> {
  return apiClientJson<{ status?: string; message?: string }>(
    `/api/orders/admin/${id}`,
    { method: "DELETE" }
  );
}

export function formatOrderMoney(
  amount: string | number | null | undefined,
  currency = "PKR"
): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  const value = Number.isFinite(n) ? n : 0;
  const code = currency || "PKR";
  try {
    return new Intl.NumberFormat(
      code === "BHD" ? "en-BH" : code === "PKR" ? "en-PK" : "en-US",
      {
        style: "currency",
        currency: code,
        minimumFractionDigits: code === "BHD" ? 3 : 2,
        maximumFractionDigits: code === "BHD" ? 3 : 2,
      }
    ).format(value);
  } catch {
    return `${code} ${value.toFixed(code === "BHD" ? 3 : 2)}`;
  }
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    CONFIRM: "Confirmed",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    CUSTOM_CLEARANCE: "Custom clearance",
    CUSTOMS_CLEARANCE: "Custom clearance",
    SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivered",
    FAILED: "Failed",
  };
  return map[status?.toUpperCase()] || status || "—";
}

export function getPaymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    PAID: "Paid",
    CAPTURED: "Paid",
    SUCCESS: "Paid",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    COD: "Cash on delivery",
  };
  return map[status?.toUpperCase()] || status || "—";
}
