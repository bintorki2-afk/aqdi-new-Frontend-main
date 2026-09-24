import type { CreateContractStep } from "@/features/create-contract/types/create-contract-step";
import { CREATE_CONTRACT_STEPS } from "@/features/create-contract/types/create-contract-step";
import type { DeedTypeId } from "@/features/create-contract/types/deed-type";
import type { ContractSession } from "@/features/create-contract/types/contract-session";
import type { ContractStep1ApiData } from "@/features/create-contract/types/contract-step1-api";
import type { ContractStep2ApiData } from "@/features/create-contract/types/contract-step2-api";
import type { ContractStep3ApiData } from "@/features/create-contract/types/contract-step3-api";
import type { ContractStep4ApiData } from "@/features/create-contract/types/contract-step4-api";
import type { ContractStep5ApiData } from "@/features/create-contract/types/contract-step5-api";
import type { ContractStep6ApiData } from "@/features/create-contract/types/contract-step6-api";
import { isOwnerStepSkipped } from "@/features/create-contract/utils/is-owner-step-skipped";

type ContractStepProgressState = {
  currentStep: CreateContractStep;
  maxReachedStepIndex: number;
  contractSession: ContractSession | null;
  selectedDeedType: DeedTypeId | "";
  contractStep1Data: ContractStep1ApiData | null;
  contractStep2Data: ContractStep2ApiData | null;
  contractStep3Data: ContractStep3ApiData | null;
  contractStep4Data: ContractStep4ApiData | null;
  contractStep5Data: ContractStep5ApiData | null;
  contractStep6Data: ContractStep6ApiData | null;
};

function getSkipOwnerProgressState(state: ContractStepProgressState) {
  return {
    selectedDeedType: state.selectedDeedType,
    instrumentType: state.contractStep1Data?.instrument_type,
  };
}

export function getMaxUnlockedContractStepIndex(state: ContractStepProgressState) {
  return Math.max(
    state.maxReachedStepIndex ?? 0,
    CREATE_CONTRACT_STEPS.indexOf(state.currentStep),
  );
}

export function canNavigateToContractStep(
  step: CreateContractStep,
  state: ContractStepProgressState,
) {
  if (step === "owner" && isOwnerStepSkipped(getSkipOwnerProgressState(state))) {
    return false;
  }

  const stepIndex = CREATE_CONTRACT_STEPS.indexOf(step);
  return stepIndex <= getMaxUnlockedContractStepIndex(state);
}
