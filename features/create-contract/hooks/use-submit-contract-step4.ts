"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useCreateContractDraftStore } from "@/features/create-contract/stores/use-create-contract-draft-store";
import type { TenantDataState } from "@/features/create-contract/types/tenant-step";

type SubmitContractStep4Input = {
  tenantData: TenantDataState;
  isLeaseRenewal?: boolean;
  notes?: string;
};

export function useSubmitContractStep4() {
  const t = useTranslations("createContract.tenant");
  const contractSession = useCreateContractDraftStore((state) => state.contractSession);
  const contractStep3Data = useCreateContractDraftStore((state) => state.contractStep3Data);
  const contractStep4Data = useCreateContractDraftStore((state) => state.contractStep4Data);

  async function submitStep4(
    input: SubmitContractStep4Input,
  ): Promise<boolean> {
    // Data is captured into the client draft; the backend write is skipped.
    void input;

    const contractId =
      contractSession?.contractId ??
      contractStep3Data?.contract_id ??
      contractStep4Data?.contract_id;

    if (!contractId) {
      toast.error(t("missingContractSession"));
      return false;
    }

    // Read the live value: the store drops step-4 data as soon as the tenant
    // form is edited, so only an unchanged, already-saved step is skipped.
    const savedStep4 = useCreateContractDraftStore.getState().contractStep4Data;
    if (savedStep4 && savedStep4.step >= 5) {
      return true;
    }

    return true;
  }

  return {
    submitStep4,
    isSubmitting: false,
  };
}
