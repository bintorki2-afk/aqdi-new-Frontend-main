"use server";

import type {
  PaymentContentApiResponse,
  PaymentContentItem,
  PaymentContentType,
} from "@/features/payment/types/payment-content";
import { apiRequest } from "@/lib/api/api-request";

export async function getPaymentContent(
  type: PaymentContentType,
): Promise<PaymentContentItem | null> {
  const response = await apiRequest<PaymentContentApiResponse>(
    `/payment-content?type=${type}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok || !response.data?.success) {
    return null;
  }

  const data = response.data.data;

  // The backend returns `data: null` when no content is configured (and may
  // return a single object); never let the success/error page 500 on it.
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  if (data && typeof data === "object" && "message" in data) {
    return data;
  }

  return null;
}
