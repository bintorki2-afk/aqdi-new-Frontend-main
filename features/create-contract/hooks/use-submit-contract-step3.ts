"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useCreateContractDraftStore } from "@/features/create-contract/stores/use-create-contract-draft-store";
import type {
  AgentDataState,
  OwnerDataState,
} from "@/features/create-contract/types/owner-step";
import type { ContractStep3RepresentativeMode } from "@/features/create-contract/utils/build-contract-step3-form-data";

type SubmitContractStep3Input = {
  ownerData: OwnerDataState;
  agentData: AgentDataState;
  representativeMode?: ContractStep3RepresentativeMode;
};

export function useSubmitContractStep3() {
  const t = useTranslations("createContract.owner");
  const contractSession = useCreateContractDraftStore((state) => state.contractSession);
  const contractStep2Data = useCreateContractDraftStore((state) => state.contractStep2Data);
  const contractStep3Data = useCreateContractDraftStore((state) => state.contractStep3Data);

  async function submitStep3(
    input: SubmitContractStep3Input,
  ): Promise<boolean> {
    // Data is captured into the client draft; the backend write is skipped.
    void input;

    const contractId =
      contractSession?.contractId ??
      contractStep2Data?.contract_id ??
      contractStep3Data?.contract_id;

    if (!contractId) {
      toast.error(t("missingContractSession"));
      return false;
    }

    return true;
  }

  return {
    submitStep3,
    isSubmitting: false,
  };
}
