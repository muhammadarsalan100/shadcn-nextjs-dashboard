import { apiClientJson } from "@/lib/api-client";

export type OrderStatus =
  | "CONFIRM"
  | "CONFIRMED"
  | "PROCESSING"
  | "CUSTOM_CLEARANCE"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export const ORDER_STATUSES: OrderStatus[] = [
  "CONFIRM",
  "CONFIRMED",
  "PROCESSING",
  "CUSTOM_CLEARANCE",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
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

export type OrderItemPricingTier = {
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  finalPrice: number;
  totalPrice: number;
};

export type OrderItemPricing = {
  regular: OrderItemPricingTier | null;
  welcomeOffer: OrderItemPricingTier | null;
  totalPrice: number;
  lineDiscount: number;
  currencyCode: string;
};

export type OrderItem = {
  id: number;
  productId?: number;
  productSizeId?: number;
  productName: string;
  size: string;
  quantity: number;
  price: string | number;
  discountPercentage?: string | number;
  finalPrice?: string | number;
  thumbnailUrl?: string | null;
  pricing?: OrderItemPricing | null;
};

export function getOrderItemUnitPrice(item: OrderItem): number {
  const tier = item.pricing?.regular ?? item.pricing?.welcomeOffer;
  if (tier) return Number(tier.finalPrice) || Number(tier.unitPrice) || 0;
  return Number(item.finalPrice) || Number(item.price) || 0;
}

export function getOrderItemOriginalPrice(item: OrderItem): number {
  const tier = item.pricing?.regular ?? item.pricing?.welcomeOffer;
  if (tier) return Number(tier.unitPrice) || 0;
  return Number(item.price) || getOrderItemUnitPrice(item);
}

export function getOrderItemLineTotal(item: OrderItem): number {
  const tier = item.pricing?.regular ?? item.pricing?.welcomeOffer;
  if (item.pricing?.totalPrice != null) return Number(item.pricing.totalPrice) || 0;
  if (tier?.totalPrice != null) return Number(tier.totalPrice) || 0;
  return getOrderItemUnitPrice(item) * (Number(item.quantity) || 1);
}

export type OrderPayment = {
  id: number;
  paymentMethod: string;
  amount: string | number;
  currency: string;
  status: string;
  transactionId?: string | null;
  gatewayOrderId?: string | null;
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
  localCurrency: string | null;
  localTotalAmount: string | number | null;
  bhdToLocalRate: string | number | null;
  freeShippingApplied: boolean;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
  payments?: OrderPayment[];
};

export type GetOrdersParams = {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  search?: string;
  searchBy?: "orderNumber" | "customerName" | "customerEmail" | "customerPhone";
  userId?: number;
  regionId?: number;
  country?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  attentionPage?: number;
  activePage?: number;
  closedPage?: number;
};

export type OrderGroup = {
  orders: Order[];
  results: number;
  totalResults: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type AdminOrdersResponse = {
  needsAttention: OrderGroup;
  active: OrderGroup;
  closed: OrderGroup;
};

// Get all orders (admin)
export async function getOrders(params?: GetOrdersParams): Promise<AdminOrdersResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status.toUpperCase() !== "ALL") query.set("status", params.status);
  if (params?.paymentStatus && params.paymentStatus.toUpperCase() !== "ALL") {
    query.set("paymentStatus", params.paymentStatus);
  }
  if (params?.paymentMethod && params.paymentMethod.toUpperCase() !== "ALL") {
    query.set("paymentMethod", params.paymentMethod);
  }
  if (params?.search && params.searchBy) {
    query.set("search", params.search);
    query.set("searchBy", params.searchBy);
  }
  if (params?.userId !== undefined) query.set("userId", String(params.userId));
  if (params?.regionId !== undefined) query.set("regionId", String(params.regionId));
  if (params?.country) query.set("country", params.country);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 20));
  if (params?.attentionPage !== undefined) query.set("attentionPage", String(params.attentionPage));
  if (params?.activePage !== undefined) query.set("activePage", String(params.activePage));
  if (params?.closedPage !== undefined) query.set("closedPage", String(params.closedPage));

  const endpoint = `/api/orders/admin?${query.toString()}`;
  const json = await apiClientJson<{ data: AdminOrdersResponse }>(endpoint);
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
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
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

export function getPaymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    COD: "Cash on delivery",
    PREPAID: "Prepaid (card/online)",
    CARD: "Card",
  };
  return map[method?.toUpperCase()] || method || "—";
}
