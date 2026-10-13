export const WA_PHONE = "6281234567890";

export function createWhatsAppUrl(message: string): string {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppOrder(message: string) {
  if (typeof window !== "undefined") {
    window.open(createWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  }
}

export interface OrderSubmissionData {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  totalPrice?: number;
  generatorSlug: string;
  generatorTitle: string;
  configJson?: Record<string, unknown> | string;
  previewImage?: string;
}

/**
 * Saves order to local database via API, appends generated Order ID to WhatsApp text,
 * and launches WhatsApp checkout tab.
 */
export async function submitOrderAndOpenWhatsApp(
  data: OrderSubmissionData,
  message: string
): Promise<string | null> {
  let orderId: string | null = null;
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: data.customerName || "Pelanggan Aureate Craft",
        customerPhone: data.customerPhone || "08123456789",
        customerEmail: data.customerEmail,
        notes: data.notes,
        totalPrice: data.totalPrice || 0,
        items: [
          {
            generatorSlug: data.generatorSlug,
            generatorTitle: data.generatorTitle,
            configJson:
              typeof data.configJson === "string"
                ? data.configJson
                : JSON.stringify(data.configJson || {}),
            previewImage: data.previewImage || null,
            quantity: 1,
            unitPrice: data.totalPrice || 0,
            subtotal: data.totalPrice || 0,
          },
        ],
      }),
    });

    const resJson = await res.json();
    if (resJson.ok && resJson.orderId) {
      orderId = resJson.orderId;
    }
  } catch (error) {
    console.warn("Auto-saving order to database failed, continuing to WhatsApp:", error);
  }

  const finalMsg = orderId
    ? `Halo Aureate Craft! 🚀\n*NO. PESANAN: ${orderId}*\n\n${message}`
    : message;

  openWhatsAppOrder(finalMsg);
  return orderId;
}
