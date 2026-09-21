"use client";

import {
  isAgentDataComplete,
  isOwnerDataComplete,
  isRepresentativeDataComplete,
} from "@/features/create-contract/types/owner-step";
import {
  deedTypeIsDeceasedOwner,
  deedTypeIsWaqfOwner,
} from "@/features/create-contract/types/deed-type";
import { mapInstrumentTypeToDeedType } from "@/features/create-contract/utils/map-instrument-type-to-deed-type";
import { useCreateContractDraftStore } from "@/features/create-contract/stores/use-create-contract-draft-store";
import type { ContractStep3RepresentativeMode } from "@/features/create-contract/utils/build-contract-step3-form-data";

export function useCreateContractOwnerStep() {
  const owner = useCreateContractDraftStore((state) => state.owner);
  const setOwnerData = useCreateContractDraftStore((state) => state.setOwnerData);
  const setAgentData = useCreateContractDraftStore((state) => state.setAgentData);
  const selectedDeedType = useCreateContractDraftStore(
    (state) => state.deed.selectedDeedType,
  );
  const instrumentType = useCreateContractDraftStore(
    (state) => state.contractStep1Data?.instrument_type,
  );

  const effectiveDeedType =
    selectedDeedType ||
    (instrumentType ? mapInstrumentTypeToDeedType(instrumentType) : "");

  const isDeceasedOwner = deedTypeIsDeceasedOwner(effectiveDeedType);
  const isWaqfOwner = deedTypeIsWaqfOwner(effectiveDeedType);
  const representativeMode: ContractStep3RepresentativeMode = isDeceasedOwner
    ? "deceased"
    : isWaqfOwner
      ? "waqf"
      : null;

  // بوكالة also requires the PoA number and date written in the instrument.
  const agentPoaExtrasComplete =
    owner.agentData.poaNumber.trim() !== "" &&
    owner.agentData.poaDate.trim() !== "";

  const ownerComplete = isOwnerDataComplete(owner.ownerData);
  const agentComplete =
    owner.ownerData.hasAgent !== "yes" ||
    (isAgentDataComplete(owner.agentData) && agentPoaExtrasComplete);

  const canContinue = representativeMode
    ? // #30/#31: only the legal representative's data is required for these deeds.
      isRepresentativeDataComplete(owner.agentData)
    : ownerComplete && agentComplete;

  return {
    ownerData: owner.ownerData,
    setOwnerData,
    agentData: owner.agentData,
    setAgentData,
    canContinue,
    representativeMode,
  };
}
