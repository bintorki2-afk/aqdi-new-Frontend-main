import type {
  AgentDataState,
  OwnerDataState,
} from "@/features/create-contract/types/owner-step";
import {
  appendPropertyOwnerBirthDate,
  formatPropertyOwnerMobileForApi,
  normalizePropertyOwnerIban,
} from "@/features/create-property/utils/property-owner-api";

/**
 * "deceased" → heirs' agent (وكيل الورثة); "waqf" → waqf trustee (ناظر الوقف).
 * In representative mode the living-owner fields are hidden and the legal
 * representative is collected via the agent/PoA fields.
 */
export type ContractStep3RepresentativeMode = "deceased" | "waqf" | null;

export type ContractStep3FormPayload = {
  contractId: number;
  ownerData: OwnerDataState;
  agentData: AgentDataState;
  representativeMode?: ContractStep3RepresentativeMode;
};

/** Agent / representative block: id, birth date, phone, PoA number/date + document. */
function appendAgentFields(formData: FormData, agentData: AgentDataState) {
  formData.append(
    "id_num_of_property_owner_agent",
    agentData.idNumber.replace(/[٠-٩۰-۹]/g, (d) => "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(d) % 10 + "").replace(/\D/g, ""),
  );
  appendPropertyOwnerBirthDate(formData, agentData.birthDate, {
    calendarField: "type_dob_property_owner_agent",
    dayField: "dob_of_property_owner_agent_day",
    monthField: "dob_of_property_owner_agent_month",
    yearField: "dob_of_property_owner_agent_year",
  });
  formData.append(
    "mobile_of_property_owner_agent",
    formatPropertyOwnerMobileForApi(agentData.phone),
  );

  const poaNumber = agentData.poaNumber.trim();
  if (poaNumber) {
    formData.append(
      "agency_number_in_instrument_of_property_owner",
      poaNumber,
    );
  }

  const poaDate = agentData.poaDate.trim();
  if (poaDate) {
    formData.append("agency_instrument_date_of_property_owner", poaDate);
  }

  const powerOfAttorneyFile = agentData.powerOfAttorneyFiles[0];
  if (powerOfAttorneyFile) {
    formData.append("copy_of_the_authorization_or_agency", powerOfAttorneyFile);
  }
}

export function appendContractStep3Fields(
  formData: FormData,
  payload: ContractStep3FormPayload,
) {
  const { ownerData, agentData, representativeMode } = payload;
  const isRepresentative =
    representativeMode === "deceased" || representativeMode === "waqf";

  formData.append("id", String(payload.contractId));

  if (isRepresentative) {
    // #30/#31: owner is deceased / waqf — collect the legal representative
    // (heirs' agent / waqf trustee) instead of the living owner.
    formData.append("add_legal_agent_of_owner", "1");
    if (representativeMode === "deceased") {
      formData.append("property_owner_is_deceased", "1");
    }
    appendAgentFields(formData, agentData);
    return;
  }

  formData.append("type_dob_property_owner", ownerData.birthDate.calendarType);

  const ownerName = ownerData.fullName.trim();
  if (ownerName) {
    formData.append("name_owner", ownerName);
  }

  formData.append(
    "property_owner_id_num",
    ownerData.idNumber.replace(/[٠-٩۰-۹]/g, (d) => "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(d) % 10 + "").replace(/\D/g, ""),
  );
  formData.append(
    "property_owner_dob_day",
    ownerData.birthDate.day.replace(/[٠-٩۰-۹]/g, (d) => "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(d) % 10 + "").replace(/\D/g, "").padStart(2, "0"),
  );
  formData.append(
    "property_owner_dob_month",
    ownerData.birthDate.month.replace(/[٠-٩۰-۹]/g, (d) => "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(d) % 10 + "").replace(/\D/g, "").padStart(2, "0"),
  );
  formData.append(
    "property_owner_dob_year",
    ownerData.birthDate.year.replace(/[٠-٩۰-۹]/g, (d) => "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹".indexOf(d) % 10 + "").replace(/\D/g, ""),
  );
  formData.append(
    "property_owner_mobile",
    formatPropertyOwnerMobileForApi(ownerData.phone),
  );

  const ownerIban = normalizePropertyOwnerIban(ownerData.iban);
  if (ownerIban) {
    formData.append("property_owner_iban", ownerIban);
  }

  formData.append(
    "add_legal_agent_of_owner",
    ownerData.hasAgent === "yes" ? "1" : "0",
  );

  if (ownerData.hasAgent === "yes") {
    appendAgentFields(formData, agentData);
  }
}
