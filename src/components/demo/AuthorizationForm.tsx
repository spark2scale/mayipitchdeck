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
  { key: "firstName",         label: "First Name",         placeholder: "Patient first name" },
  { key: "lastName",          label: "Last Name",          placeholder: "Patient last name" },
  { key: "dob",               label: "Date of Birth",      placeholder: "MM/DD/YYYY" },
  { key: "phone",             label: "Phone",               placeholder: "(000) 000-0000" },
  { key: "address",           label: "Address",             placeholder: "Street, City, State ZIP" },
  { key: "emergencyContact",  label: "Emergency Contact",   placeholder: "Name (Relation) — Phone" },
  { key: "preferredPharmacy", label: "Preferred Pharmacy",  placeholder: "Pharmacy name and location" },
  // Visit
  { key: "reasonForVisit",    label: "Reason for Visit",    placeholder: "Chief complaint / visit reason" },
  { key: "referringProvider", label: "Referring Provider",  placeholder: "Dr. First Last, MD" },
  // Insurance
  { key: "insurance",         label: "Insurance Carrier",   placeholder: "Insurance company name" },
  { key: "memberId",          label: "Member ID",           placeholder: "Insurance member ID" },
];

export { FIELDS };

export default function AuthorizationForm({ values, activeField }: Props) {
  return (
    <div className="af-root" id="authorization-form">
      {/* Header */}
      <div className="af-header">
        <div className="af-header-badge">EMR Patient Chart</div>
        <div className="af-header-sub">
          Complete all fields to create the new patient chart
        </div>
      </div>

      {/* Form body */}
      <div className="af-body">
        <div className="af-sections">
          {/* Demographics */}
          <fieldset className="af-fieldset">
            <legend className="af-legend">Patient Demographics</legend>
            <div className="af-grid">
              {FIELDS.slice(0, 7).map((f) => (
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

          {/* Visit */}
          <fieldset className="af-fieldset">
            <legend className="af-legend">Visit Details</legend>
            <div className="af-grid">
              {FIELDS.slice(7, 9).map((f) => (
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
              {FIELDS.slice(9).map((f) => (
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
            Save to Chart
          </button>
          <span className="af-submit-hint">
            All fields required before saving
          </span>
        </div>
      </div>
    </div>
  );
}
