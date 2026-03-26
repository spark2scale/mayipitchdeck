import type { PatientData } from "./generatePatientData";

// Partial form state — keys match PatientData
export type FormValues = Partial<Record<keyof PatientData, string>>;

interface Props {
  values: FormValues;
  activeField: keyof PatientData | null;
}

interface FieldDef {
  key: keyof PatientData;
  label: string;
  placeholder: string;
}

const FIELDS: FieldDef[] = [
  // Demographics
  { key: "firstName",     label: "First Name",        placeholder: "Patient first name" },
  { key: "lastName",      label: "Last Name",         placeholder: "Patient last name" },
  { key: "dob",           label: "Date of Birth",     placeholder: "MM/DD/YYYY" },
  { key: "phone",         label: "Phone",             placeholder: "(000) 000-0000" },
  { key: "address",       label: "Address",           placeholder: "Street, City, State ZIP" },
  // Insurance
  { key: "insurance",     label: "Insurance Carrier", placeholder: "Insurance company name" },
  { key: "memberId",      label: "Member ID",         placeholder: "Insurance member ID" },
  { key: "groupNumber",   label: "Group Number",      placeholder: "Group / plan number" },
  // Clinical
  { key: "diagnosisCode", label: "Diagnosis Code",    placeholder: "ICD-10 code" },
  { key: "diagnosisDesc", label: "Diagnosis Description", placeholder: "Diagnosis description" },
  { key: "cptCode",       label: "CPT Code",          placeholder: "Procedure CPT code" },
  { key: "procedureName", label: "Procedure Name",    placeholder: "Procedure description" },
  // Provider
  { key: "providerName",  label: "Provider Name",     placeholder: "Dr. First Last, MD" },
  { key: "providerNpi",   label: "Provider NPI",      placeholder: "10-digit NPI number" },
];

export { FIELDS };

export default function AuthorizationForm({ values, activeField }: Props) {
  return (
    <div className="af-root" id="authorization-form">
      {/* Header */}
      <div className="af-header">
        <div className="af-header-badge">Insurance Pre-Authorization Portal</div>
        <div className="af-header-sub">
          Complete all fields to submit for prior authorization review
        </div>
      </div>

      {/* Form body */}
      <div className="af-body">
        <div className="af-sections">
          {/* Demographics */}
          <fieldset className="af-fieldset">
            <legend className="af-legend">Patient Demographics</legend>
            <div className="af-grid">
              {FIELDS.slice(0, 5).map((f) => (
                <div
                  key={f.key}
                  className={`af-field ${activeField === f.key ? "af-field--active" : ""}`}
                  data-field={f.key}
                >
                  <label className="af-label" htmlFor={`af-${f.key}`}>
                    {f.label}
                  </label>
                  <input
                    id={`af-${f.key}`}
                    name={f.key}
                    className="af-input"
                    type="text"
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    readOnly
                    data-field={f.key}
                    aria-label={f.label}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Insurance */}
          <fieldset className="af-fieldset">
            <legend className="af-legend">Insurance Information</legend>
            <div className="af-grid">
              {FIELDS.slice(5, 8).map((f) => (
                <div
                  key={f.key}
                  className={`af-field ${activeField === f.key ? "af-field--active" : ""}`}
                  data-field={f.key}
                >
                  <label className="af-label" htmlFor={`af-${f.key}`}>
                    {f.label}
                  </label>
                  <input
                    id={`af-${f.key}`}
                    name={f.key}
                    className="af-input"
                    type="text"
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    readOnly
                    data-field={f.key}
                    aria-label={f.label}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Clinical */}
          <fieldset className="af-fieldset">
            <legend className="af-legend">Clinical Information</legend>
            <div className="af-grid">
              {FIELDS.slice(8, 12).map((f) => (
                <div
                  key={f.key}
                  className={`af-field ${activeField === f.key ? "af-field--active" : ""}`}
                  data-field={f.key}
                >
                  <label className="af-label" htmlFor={`af-${f.key}`}>
                    {f.label}
                  </label>
                  <input
                    id={`af-${f.key}`}
                    name={f.key}
                    className="af-input"
                    type="text"
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    readOnly
                    data-field={f.key}
                    aria-label={f.label}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Provider */}
          <fieldset className="af-fieldset">
            <legend className="af-legend">Requesting Provider</legend>
            <div className="af-grid">
              {FIELDS.slice(12).map((f) => (
                <div
                  key={f.key}
                  className={`af-field ${activeField === f.key ? "af-field--active" : ""}`}
                  data-field={f.key}
                >
                  <label className="af-label" htmlFor={`af-${f.key}`}>
                    {f.label}
                  </label>
                  <input
                    id={`af-${f.key}`}
                    name={f.key}
                    className="af-input"
                    type="text"
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    readOnly
                    data-field={f.key}
                    aria-label={f.label}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Submit */}
        <div className="af-footer">
          <button className="af-submit-btn" disabled aria-disabled="true">
            Submit for Authorization
          </button>
          <span className="af-submit-hint">
            All fields required before submission
          </span>
        </div>
      </div>
    </div>
  );
}
