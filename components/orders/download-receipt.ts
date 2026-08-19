import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Order,
  formatOrderMoney,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/app/services/orders";

// Fetched at generation time from public/logo.jpg rather than embedded inline — a hand-copied
// base64 blob this large is too easy to corrupt via a single dropped/truncated character.
// Actual pixel size 1280x1198 (~1.068:1) — used below to keep the aspect ratio correct.
const LOGO_ASPECT_RATIO = 1280 / 1198;
let cachedLogoDataUri: string | null | undefined;

async function getLogoDataUri(): Promise<string | null> {
  if (cachedLogoDataUri !== undefined) return cachedLogoDataUri;
  try {
    const res = await fetch("/logo.jpg");
    if (!res.ok) throw new Error(`Failed to fetch logo: ${res.status}`);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    cachedLogoDataUri = `data:image/jpeg;base64,${btoa(binary)}`;
  } catch {
    cachedLogoDataUri = null;
  }
  return cachedLogoDataUri;
}

function formatReceiptDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function downloadOrderReceipt(order: Order) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 16;

  // Logo (already contains the full "RAMIK PERFUMES" wordmark lockup)
  const logoDataUri = await getLogoDataUri();
  const logoWidth = 28;
  const logoHeight = logoWidth / LOGO_ASPECT_RATIO;
  const logoTop = 12;
  let titleX = marginX;

  if (logoDataUri) {
    doc.addImage(logoDataUri, "JPEG", marginX, logoTop, logoWidth, logoHeight);
    titleX = marginX + logoWidth + 8;
  }

  const titleBaselineY = logoTop + logoHeight / 2 + 3;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("INVOICE", titleX, titleBaselineY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(order.orderNumber || `#${order.id}`, titleX, titleBaselineY + 6);

  doc.setFontSize(10);
  doc.text(`Date: ${formatReceiptDate(order.createdAt)}`, pageWidth - marginX, titleBaselineY - 3, {
    align: "right",
  });
  doc.text(
    `${getOrderStatusLabel(order.status)} · ${getPaymentStatusLabel(order.paymentStatus)}`,
    pageWidth - marginX,
    titleBaselineY + 3,
    { align: "right" }
  );

  let cursorY = Math.max(logoTop + logoHeight, titleBaselineY + 6) + 8;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.6);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);

  cursorY += 10;
  const colWidth = (pageWidth - marginX * 2) / 2;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("CUSTOMER", marginX, cursorY);
  doc.text("SHIPPING ADDRESS", marginX + colWidth, cursorY);

  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.text(order.customerName || "—", marginX, cursorY + 6);
  doc.text(order.shippingAddress || "—", marginX + colWidth, cursorY + 6, {
    maxWidth: colWidth - 4,
  });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(order.customerEmail || "", marginX, cursorY + 12);
  doc.text(order.customerPhone || "", marginX, cursorY + 18);
  doc.text(order.country || "", marginX + colWidth, cursorY + 12);

  cursorY += 28;

  const itemRows = (order.items || []).map((item) => {
    const discount = Number(item.discountPercentage) || 0;
    const finalPrice = Number(item.finalPrice) || 0;
    const lineTotal = finalPrice * (item.quantity || 1);
    const productName = (item.productName || "").trim();
    const size = (item.size || "").trim();
    return [
      size ? `${productName} (${size})` : productName,
      String(item.quantity),
      formatOrderMoney(finalPrice, order.currency),
      discount > 0 ? `${discount}%` : "—",
      formatOrderMoney(lineTotal, order.currency),
    ];
  });

  const rightHead = (label: string) => ({
    content: label,
    styles: { halign: "right" as const },
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [
      [
        "Product",
        { content: "Qty", styles: { halign: "center" as const } },
        rightHead("Unit Price"),
        rightHead("Discount"),
        rightHead("Line Total"),
      ],
    ],
    body: itemRows,
    styles: { fontSize: 9.5, textColor: [30, 30, 30] },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [110, 110, 110],
      fontStyle: "normal",
      lineWidth: { bottom: 0.3 },
      lineColor: [210, 210, 210],
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    theme: "plain",
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (order.payments && order.payments.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("PAYMENTS", marginX, cursorY);
    cursorY += 4;

    const paymentRows = order.payments.map((payment) => [
      getPaymentMethodLabel(payment.paymentMethod),
      getPaymentStatusLabel(payment.status),
      payment.transactionId || payment.gatewayOrderId || "—",
      formatOrderMoney(payment.amount, payment.currency),
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [["Method", "Status", "Reference", rightHead("Amount")]],
      body: paymentRows,
      styles: { fontSize: 9.5, textColor: [30, 30, 30] },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [110, 110, 110],
        fontStyle: "normal",
        lineWidth: { bottom: 0.3 },
        lineColor: [210, 210, 210],
      },
      columnStyles: { 3: { halign: "right" } },
      theme: "plain",
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  const totalsX = pageWidth - marginX;
  const labelX = totalsX - 60;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text("Subtotal", labelX, cursorY);
  doc.setTextColor(20, 20, 20);
  doc.text(formatOrderMoney(order.subtotal, order.currency), totalsX, cursorY, {
    align: "right",
  });

  if (Number(order.discountAmount) > 0) {
    cursorY += 6;
    doc.setTextColor(90, 90, 90);
    doc.text("Discount", labelX, cursorY);
    doc.setTextColor(5, 150, 105);
    doc.text(`-${formatOrderMoney(order.discountAmount, order.currency)}`, totalsX, cursorY, {
      align: "right",
    });
  }

  cursorY += 6;
  doc.setTextColor(90, 90, 90);
  doc.text("Shipping", labelX, cursorY);
  doc.setTextColor(20, 20, 20);
  doc.text(
    Number(order.shippingAmount) > 0
      ? formatOrderMoney(order.shippingAmount, order.currency)
      : "Free",
    totalsX,
    cursorY,
    { align: "right" }
  );

  cursorY += 4;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.6);
  doc.line(labelX, cursorY, totalsX, cursorY);

  cursorY += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Total", labelX, cursorY);
  doc.text(formatOrderMoney(order.totalAmount, order.currency), totalsX, cursorY, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text("Thank you for your order.", pageWidth / 2, 285, { align: "center" });

  doc.save(`invoice-${order.orderNumber || order.id}.pdf`);
}
