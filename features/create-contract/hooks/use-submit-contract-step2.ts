"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useCreateContractDraftStore } from "@/features/create-contract/stores/use-create-contract-draft-store";
import type { NationalAddressMethodId } from "@/features/create-contract/types/national-address";
import type { ManualNationalAddressData } from "@/features/shared/types/manual-national-address";

type SubmitContractStep2Input = {
  addressMethod: NationalAddressMethodId;
  photoFiles: File[];
  linkUrl: string;
  manualAddress: ManualNationalAddressData;
};

export function useSubmitContractStep2() {
  const t = useTranslations("createContract.deed");
  const contractSession = useCreateContractDraftStore((state) => state.contractSession);
  const contractStep1Data = useCreateContractDraftStore((state) => state.contractStep1Data);
  const contractStep2Data = useCreateContractDraftStore((state) => state.contractStep2Data);
  const isExistingPropertyContract = useCreateContractDraftStore(
    (state) => state.existingPropertyContext !== null,
  );

  async function submitStep2({
    addressMethod,
    photoFiles,
  }: SubmitContractStep2Input): Promise<boolean> {
    const contractId = contractSession?.contractId ?? contractStep1Data?.contract_id;

    if (!contractId) {
      toast.error(t("missingContractSession"));
      return false;
    }

    if (contractStep2Data && contractStep2Data.step >= 3) {
      return true;
    }

    // Existing-property contracts already have the national address stored on
    // the backend from /contract/start, so allow continuing without re-uploading
    // a photo when the user hasn't picked a new one.
    if (
      isExistingPropertyContract &&
      addressMethod === "photo" &&
      photoFiles.length === 0
    ) {
      return true;
    }

    return true;
  }

  return {
    submitStep2,
    isSubmitting: false,
  };
}
