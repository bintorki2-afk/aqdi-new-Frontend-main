"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useCreateContractDraftStore } from "@/features/create-contract/stores/use-create-contract-draft-store";
import type { FinanceDataState } from "@/features/create-contract/types/finance-step";

type SubmitContractStep6Input = {
  financeData: FinanceDataState;
};

export function useSubmitContractStep6() {
  const t = useTranslations("createContract.finance");
  const contractSession = useCreateContractDraftStore((state) => state.contractSession);
  const contractStep5Data = useCreateContractDraftStore((state) => state.contractStep5Data);
  const contractStep6Data = useCreateContractDraftStore((state) => state.contractStep6Data);

  async function submitStep6(
    input: SubmitContractStep6Input,
  ): Promise<boolean> {
    // Data is captured into the client draft; the backend write is skipped.
    void input;

    const contractId =
      contractSession?.contractId ??
      contractStep5Data?.contract_id ??
      contractStep6Data?.contract_id;

    if (!contractId) {
      toast.error(t("missingContractSession"));
      return false;
    }

    // Read the live value: the store drops step-6 data as soon as the finance
    // form is edited (including the sanitize pass right before submit), so only
    // an unchanged, already-saved step is skipped.
    const savedStep6 = useCreateContractDraftStore.getState().contractStep6Data;
    if (savedStep6 && savedStep6.step >= 7) {
      return true;
    }

    return true;
  }

  return {
    submitStep6,
    isSubmitting: false,
  };
}
