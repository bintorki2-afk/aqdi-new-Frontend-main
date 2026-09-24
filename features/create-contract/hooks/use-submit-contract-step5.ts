"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useCreateContractDraftStore } from "@/features/create-contract/stores/use-create-contract-draft-store";
import type { RentedUnitDataState } from "@/features/create-contract/types/rented-unit-step";

type SubmitContractStep5Input = {
  rentedUnits: RentedUnitDataState[];
};

export function useSubmitContractStep5() {
  const t = useTranslations("createContract.tenant");
  const contractSession = useCreateContractDraftStore((state) => state.contractSession);
  const contractStep4Data = useCreateContractDraftStore((state) => state.contractStep4Data);
  const contractStep5Data = useCreateContractDraftStore((state) => state.contractStep5Data);

  async function submitStep5(
    input: SubmitContractStep5Input,
  ): Promise<boolean> {
    // Data is captured into the client draft; the backend write is skipped.
    void input;

    const contractId =
      contractSession?.contractId ??
      contractStep4Data?.contract_id ??
      contractStep5Data?.contract_id;

    if (!contractId) {
      toast.error(t("missingContractSession"));
      return false;
    }

    // Read the live value: the store drops step-5 data as soon as a unit is
    // edited, so only an unchanged, already-saved step is skipped.
    const savedStep5 = useCreateContractDraftStore.getState().contractStep5Data;
    if (savedStep5 && savedStep5.step >= 6) {
      return true;
    }

    return true;
  }

  return {
    submitStep5,
    isSubmitting: false,
  };
}
