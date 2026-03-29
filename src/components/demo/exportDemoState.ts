import type { PatientData } from "./generatePatientData";
import type { FormValues } from "./AuthorizationForm";

export const EXPORT_PATIENT_DATA: PatientData = {
  firstName: "Maria",
  lastName: "Johnson",
  dob: "04/18/1967",
  phone: "(512) 555-0142",
  address: "2480 Cedar Lane, Austin, TX 78704",
  insurance: "Blue Cross Blue Shield",
  memberId: "BL482951736",
  groupNumber: "GRP-48192",
  diagnosisCode: "M17.11",
  diagnosisDesc: "Primary osteoarthritis, right knee",
  cptCode: "27447",
  procedureName: "Total Knee Arthroplasty",
  providerName: "Dr. Emily Chen, MD",
  providerNpi: "1245319599",
};

export const EXPORT_FORM_VALUES: FormValues = {
  firstName: EXPORT_PATIENT_DATA.firstName,
  lastName: EXPORT_PATIENT_DATA.lastName,
  dob: EXPORT_PATIENT_DATA.dob,
  phone: EXPORT_PATIENT_DATA.phone,
  address: EXPORT_PATIENT_DATA.address,
  insurance: EXPORT_PATIENT_DATA.insurance,
  memberId: EXPORT_PATIENT_DATA.memberId,
  groupNumber: EXPORT_PATIENT_DATA.groupNumber,
  diagnosisCode: EXPORT_PATIENT_DATA.diagnosisCode,
  diagnosisDesc: EXPORT_PATIENT_DATA.diagnosisDesc,
  cptCode: EXPORT_PATIENT_DATA.cptCode,
  procedureName: EXPORT_PATIENT_DATA.procedureName,
  providerName: EXPORT_PATIENT_DATA.providerName,
  providerNpi: EXPORT_PATIENT_DATA.providerNpi,
};

export const EXPORT_LOG_TEXT = [
  "🧠 AI agent initialized export snapshot",
  "📸 Reviewed patient demographics and insurance details",
  "🖱️ Opened the authorization form",
  "⌨️ Completed all required prior-authorization fields",
  "✅ Workflow complete",
];
