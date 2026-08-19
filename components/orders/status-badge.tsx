import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "fail" | "pending" | "neutral";

export function getStatusTone(status: string): StatusTone {
  const s = (status || "").toUpperCase();

  if (
    ["DELIVERED", "PAID", "CAPTURED", "SUCCESS", "CONFIRM", "CONFIRMED"].includes(
      s
    )
  ) {
    return "success";
  }
  if (["FAILED"].includes(s)) {
    return "fail";
  }
  if (
    [
      "PENDING",
      "PROCESSING",
      "CUSTOM_CLEARANCE",
      "CUSTOMS_CLEARANCE",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "REFUNDED",
      "COD",
    ].includes(s)
  ) {
    return "pending";
  }
  return "neutral";
}

export const toneTriggerClass: Record<StatusTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-200/60 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 [&_svg]:text-emerald-700 [&_svg]:opacity-100 dark:[&_svg]:text-emerald-300",
  fail:
    "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-200/60 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 [&_svg]:text-red-600 [&_svg]:opacity-100 dark:[&_svg]:text-red-300",
  pending:
    "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus:ring-amber-200/60 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60 [&_svg]:text-amber-700 [&_svg]:opacity-100 dark:[&_svg]:text-amber-300",
  neutral: "[&_svg]:opacity-70",
};

export const toneBadgeClass: Record<StatusTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  fail:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300",
  pending:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function isPaid(paymentStatus: string): boolean {
  const s = (paymentStatus || "").toUpperCase();
  return ["PAID", "CAPTURED", "SUCCESS"].includes(s);
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  const tone = getStatusTone(status);
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", toneBadgeClass[tone], className)}
    >
      {label}
    </Badge>
  );
}
