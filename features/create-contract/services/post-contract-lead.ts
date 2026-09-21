"use server";

import { apiRequest } from "@/lib/api/api-request";

export type PostContractLeadPayload = {
  name: string;
  /** Saudi mobile in 05XXXXXXXX form. */
  phone: string;
  contractUuid: string;
  contractId: number;
  /** Omitted when unknown; the backend then fills it from the contract. */
  amount?: number;
  contractType: string;
};

type LeadApiResponse = {
  message?: string;
  success?: boolean;
};

/**
 * CR2: capture an abandoned-payment lead. Fired when the payment screen mounts;
 * the backend is idempotent per contract_uuid, so re-fires are safe no-ops.
 */
export async function postContractLead(payload: PostContractLeadPayload) {
  const response = await apiRequest<LeadApiResponse>("/leads", {
    method: "POST",
    body: JSON.stringify({
      // Empty name/phone are omitted so the backend auto-fills them from the
      // contract instead of validating an empty string.
      ...(payload.name.trim() ? { name: payload.name.trim() } : {}),
      ...(payload.phone ? { phone: payload.phone } : {}),
      contract_uuid: payload.contractUuid,
      contract_id: payload.contractId,
      ...(typeof payload.amount === "number" ? { amount: payload.amount } : {}),
      contract_type: payload.contractType,
      source: "web",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false as const, error: response.error };
  }

  return { ok: true as const };
}
