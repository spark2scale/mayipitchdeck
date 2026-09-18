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
        <div className="pdc-header-badge">New Patient Referral</div>
        <div className="pdc-header-sub">Intake Form &amp; Referral Details</div>
      </div>

      {/* Body */}
      <div className="pdc-body">
        {/* Demographics Section */}
        <div className="pdc-section">
          <div className="pdc-section-title">Patient Demographics</div>
          <Row label="Full Name"          value={`${data.firstName} ${data.lastName}`} />
          <Row label="Date of Birth"      value={data.dob} />
          <Row label="Phone"              value={data.phone} />
          <Row label="Address"            value={data.address} />
          <Row label="Emergency Contact"  value={data.emergencyContact} />
          <Row label="Preferred Pharmacy" value={data.preferredPharmacy} />
        </div>

        {/* Visit Section */}
        <div className="pdc-section">
          <div className="pdc-section-title">Visit Details</div>
          <Row label="Reason for Visit"     value={data.reasonForVisit} />
          <Row label="Referring Provider"   value={data.referringProvider} />
        </div>

        {/* Insurance Section */}
        <div className="pdc-section">
          <div className="pdc-section-title">Insurance Information</div>
          <Row label="Insurance"  value={data.insurance} />
          <Row label="Member ID"  value={data.memberId} />
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="pdc-footer">
        <button
          id="next-page-btn"
          className="pdc-next-btn"
          onClick={onNext}
          aria-label="Go to EMR Patient Chart"
        >
          Next Page →
        </button>
      </div>
    </div>
  );
}
