import type { PatientData } from "./generatePatientData";

interface Props {
  data: PatientData;
  onNext: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="pdc-row">
      <span className="pdc-label">{label}</span>
      <span className="pdc-value">{value}</span>
    </div>
  );
}

export default function PatientDataCard({ data, onNext }: Props) {
  return (
    <div className="pdc-root" id="patient-data-card">
      {/* Header */}
      <div className="pdc-header">
        <div className="pdc-header-badge">Prior Authorization Request</div>
        <div className="pdc-header-sub">Patient Demographics &amp; Clinical Information</div>
      </div>

      {/* Body */}
      <div className="pdc-body">
        {/* Demographics Section */}
        <div className="pdc-section">
          <div className="pdc-section-title">Patient Demographics</div>
          <Row label="Full Name"       value={`${data.firstName} ${data.lastName}`} />
          <Row label="Date of Birth"   value={data.dob} />
          <Row label="Phone"           value={data.phone} />
          <Row label="Address"         value={data.address} />
        </div>

        {/* Insurance Section */}
        <div className="pdc-section">
          <div className="pdc-section-title">Insurance Information</div>
          <Row label="Insurance"       value={data.insurance} />
          <Row label="Member ID"       value={data.memberId} />
          <Row label="Group Number"    value={data.groupNumber} />
        </div>

        {/* Clinical Section */}
        <div className="pdc-section">
          <div className="pdc-section-title">Clinical Information</div>
          <Row label="Diagnosis Code"  value={data.diagnosisCode} />
          <Row label="Diagnosis"       value={data.diagnosisDesc} />
          <Row label="CPT Code"        value={data.cptCode} />
          <Row label="Procedure"       value={data.procedureName} />
        </div>

        {/* Provider Section */}
        <div className="pdc-section">
          <div className="pdc-section-title">Requesting Provider</div>
          <Row label="Provider Name"   value={data.providerName} />
          <Row label="NPI Number"      value={data.providerNpi} />
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="pdc-footer">
        <button
          id="next-page-btn"
          className="pdc-next-btn"
          onClick={onNext}
          aria-label="Go to Authorization Form"
        >
          Next Page →
        </button>
      </div>
    </div>
  );
}
