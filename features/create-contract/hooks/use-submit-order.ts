"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { ContractTypeId } from "@/features/create-contract/types/contract-type";
import type { CreateContractReviewOrderSummary } from "@/features/create-contract/types/create-contract-review-order";
import { trackLead } from "@/features/analytics/utils/track";

type UseSubmitOrderArgs = {
  summary: CreateContractReviewOrderSummary;
  contractType: ContractTypeId;
};

type SubmitOrderResult = {
  ok: boolean;
  orderNumber: string;
};

function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(1000 + Math.random() * 9000));

  return `AQ-${yy}${mm}${dd}-${random}`;
}

export function useSubmitOrder({ summary, contractType }: UseSubmitOrderArgs) {
  const t = useTranslations("createContract.payment.reviewDialog");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitOrderResult | null>(null);

  async function submitOrder({
    contactWhatsapp,
  }: {
    contactWhatsapp: string;
  }): Promise<SubmitOrderResult> {
    const orderNumber = generateOrderNumber();
    const contractTypeLabel = contractType === "residential" ? "سكني" : "تجاري";

    const overviewSection = {
      title: t("title"),
      fields: [
        {
          label: t("fields.contractType"),
          value: summary.overview.contractType,
        },
        {
          label: t("fields.startDate"),
          value: summary.overview.startDate,
        },
        {
          label: t("fields.duration"),
          value: summary.overview.duration,
        },
      ],
    };

    const payload = {
      orderNumber,
      contractType: contractTypeLabel,
      whatsappNumber: contactWhatsapp,
      sections: [
        overviewSection,
        ...summary.sections.map((section) => ({
          title: section.title,
          fields: section.fields.map((field) => ({
            label: field.label,
            value: field.value,
          })),
        })),
      ],
    };

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let ok = response.ok;

      if (ok) {
        try {
          const body = (await response.json()) as { ok?: boolean };
          ok = body.ok === true;
        } catch {
          ok = false;
        }
      }

      const outcome: SubmitOrderResult = { ok, orderNumber };
      setResult(outcome);

      if (ok) {
        // Conversion signal for GTM — wired to Google Ads / Meta / TikTok /
        // X / Snap as the "generate_lead" conversion trigger.
        trackLead({ orderNumber, contractType: contractTypeLabel });
      }

      return outcome;
    } catch {
      const outcome: SubmitOrderResult = { ok: false, orderNumber };
      setResult(outcome);
      return outcome;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    submitOrder,
    isSubmitting,
    result,
  };
}
