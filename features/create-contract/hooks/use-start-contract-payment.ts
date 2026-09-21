"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getContractPaymentUrl } from "@/features/create-contract/services/get-contract-payment-url";
import type { ContractPaymentStatusSource } from "@/features/create-contract/services/get-contract-payment-status";

/**
 * The Moyasar gateway/invoice page renders in the language passed via the URL.
 * Force Arabic so the hosted payment page matches this RTL Arabic app.
 */
function withArabicPaymentLocale(paymentUrl: string) {
  try {
    const url = new URL(paymentUrl);
    // Cover the common query keys used by the hosted gateway/invoice page.
    if (!url.searchParams.has("lang")) {
      url.searchParams.set("lang", "ar");
    }
    if (!url.searchParams.has("locale")) {
      url.searchParams.set("locale", "ar");
    }
    return url.toString();
  } catch {
    return paymentUrl;
  }
}

export function useStartContractPayment() {
  const [isPaying, setIsPaying] = useState(false);

  async function startPayment(
    contractUuid: string,
    errorLabel: string,
    _source: ContractPaymentStatusSource = "contract",
  ): Promise<boolean> {
    if (isPaying || !contractUuid.trim()) {
      return false;
    }

    setIsPaying(true);

    try {
      const result = await getContractPaymentUrl(contractUuid);

      if (!result.ok) {
        toast.error(result.error || errorLabel);
        return false;
      }

      window.location.assign(withArabicPaymentLocale(result.data.paymentUrl));
      return true;
    } finally {
      setIsPaying(false);
    }
  }

  return {
    startPayment,
    isPaying,
  };
}
