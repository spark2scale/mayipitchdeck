import type { PatientData } from "./generatePatientData";
import type { FormValues } from "./AuthorizationForm";

export const EXPORT_PATIENT_DATA: PatientData = {
  firstName: "Maria",
  lastName: "Johnson",
  dob: "04/18/1967",
  phone: "(512) 555-0142",
  address: "2480 Cedar Lane, Austin, TX 78704",
  emergencyContact: "David Johnson (Spouse) — (512) 555-0198",
  preferredPharmacy: "CVS Pharmacy #4021",
  reasonForVisit: "Referral for specialist evaluation",
  referringProvider: "Dr. Emily Chen, MD",
  insurance: "Blue Cross Blue Shield",
  memberId: "BL482951736",
};

export const EXPORT_FORM_VALUES: FormValues = {
  firstName: EXPORT_PATIENT_DATA.firstName,
  lastName: EXPORT_PATIENT_DATA.lastName,
  dob: EXPORT_PATIENT_DATA.dob,
  phone: EXPORT_PATIENT_DATA.phone,
  address: EXPORT_PATIENT_DATA.address,
  emergencyContact: EXPORT_PATIENT_DATA.emergencyContact,
  preferredPharmacy: EXPORT_PATIENT_DATA.preferredPharmacy,
  reasonForVisit: EXPORT_PATIENT_DATA.reasonForVisit,
  referringProvider: EXPORT_PATIENT_DATA.referringProvider,
  insurance: EXPORT_PATIENT_DATA.insurance,
  memberId: EXPORT_PATIENT_DATA.memberId,
};

export const EXPORT_LOG_TEXT = [
  "🧠 AI agent initialized export snapshot",
  "📸 Reviewed patient referral and visit details",
  "🖱️ Opened the EMR patient chart",
  "⌨️ Completed all required chart fields",
  "✅ Patient chart created",
];
