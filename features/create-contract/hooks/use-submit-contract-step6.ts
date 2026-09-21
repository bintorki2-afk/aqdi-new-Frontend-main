"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  contractFinanceSummaryKeys,
  contractFinancialKeys,
} from "@/features/create-contract/query-keys";
import { submitContractStep6 } from "@/features/create-contract/services/submit-contract-step6";
import { useTenantRoles } from "@/features/create-contract/hooks/use-tenant-roles";
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
  const setContractStep6Data = useCreateContractDraftStore(
    (state) => state.setContractStep6Data,
  );
  const { data: tenantRoles } = useTenantRoles();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitStep6({
    financeData,
  }: SubmitContractStep6Input): Promise<boolean> {
    if (isSubmitting) {
      return false;
    }

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

    setIsSubmitting(true);

    try {
      const result = await submitContractStep6({
        contractId,
        financeData,
        roles: tenantRoles ?? [],
      });

      if (!result.ok) {
        toast.error(result.error || t("submitError"));
        return false;
      }

      setContractStep6Data(result.data);
      // The duration/rent just saved change the single-source total: refresh the
      // cached finance summary so the payment screen never shows a stale amount.
      void queryClient.invalidateQueries({ queryKey: contractFinanceSummaryKeys.all });
      void queryClient.invalidateQueries({ queryKey: contractFinancialKeys.all });
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    submitStep6,
    isSubmitting,
  };
}
