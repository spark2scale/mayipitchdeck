// ─── Patient Data Generator ──────────────────────────────────────────────────
// Produces realistic-looking (but entirely fake) prior-auth demographics.

export interface PatientData {
  // Demographics
  firstName: string;
  lastName: string;
  dob: string;         // MM/DD/YYYY
  phone: string;
  address: string;
  // Insurance
  insurance: string;
  memberId: string;
  groupNumber: string;
  // Clinical
  diagnosisCode: string;
  diagnosisDesc: string;
  cptCode: string;
  procedureName: string;
  // Provider
  providerName: string;
  providerNpi: string;
}

// ── Static pools ──────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "James", "Maria", "David", "Sandra", "Michael", "Linda", "Robert", "Barbara",
  "William", "Patricia", "Richard", "Susan", "Thomas", "Jessica", "Charles",
  "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin",
];

const INSURANCES = [
  "Blue Cross Blue Shield",
  "Aetna",
  "Cigna",
  "UnitedHealthcare",
  "Humana",
  "Kaiser Permanente",
];

const STREETS = [
  "Oak Street", "Maple Avenue", "Cedar Lane", "Pine Road", "Elm Drive",
  "Washington Blvd", "Lincoln Way", "Park Avenue", "Sunset Drive", "River Road",
];

const CITIES = [
  "Austin, TX", "Phoenix, AZ", "Charlotte, NC", "Nashville, TN",
  "Columbus, OH", "Indianapolis, IN", "Jacksonville, FL", "San Antonio, TX",
];

const CLINICAL = [
  {
    diagnosisCode: "M17.11",
    diagnosisDesc: "Primary osteoarthritis, right knee",
    cptCode: "27447",
    procedureName: "Total Knee Arthroplasty",
  },
  {
    diagnosisCode: "K80.20",
    diagnosisDesc: "Calculus of gallbladder without cholecystitis",
    cptCode: "47562",
    procedureName: "Laparoscopic Cholecystectomy",
  },
  {
    diagnosisCode: "N40.0",
    diagnosisDesc: "Benign prostatic hyperplasia without LUTS",
    cptCode: "52601",
    procedureName: "Transurethral Resection of Prostate",
  },
  {
    diagnosisCode: "M51.16",
    diagnosisDesc: "Intervertebral disc degeneration, lumbar region",
    cptCode: "22612",
    procedureName: "Lumbar Spinal Fusion",
  },
  {
    diagnosisCode: "I25.10",
    diagnosisDesc: "Atherosclerotic heart disease of native coronary artery",
    cptCode: "33533",
    procedureName: "Coronary Artery Bypass Graft",
  },
  {
    diagnosisCode: "H26.9",
    diagnosisDesc: "Unspecified cataract",
    cptCode: "66984",
    procedureName: "Cataract Removal with IOL Implant",
  },
];

const PROVIDERS = [
  { name: "Dr. Emily Chen, MD", npi: "1245319599" },
  { name: "Dr. Marcus Webb, DO", npi: "1568423170" },
  { name: "Dr. Sarah Okonkwo, MD", npi: "1679834021" },
  { name: "Dr. James Patel, MD", npi: "1780945132" },
  { name: "Dr. Lauren Tran, MD", npi: "1891056243" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

function randomDob() {
  const year = 1948 + Math.floor(Math.random() * 52); // age 22–74
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  return `${pad(month)}/${pad(day)}/${year}`;
}

function randomPhone() {
  const area = 200 + Math.floor(Math.random() * 800);
  const mid = 200 + Math.floor(Math.random() * 800);
  const end = 1000 + Math.floor(Math.random() * 9000);
  return `(${area}) ${mid}-${end}`;
}

function randomMemberId(ins: string) {
  const prefix = ins.slice(0, 2).toUpperCase();
  const digits = String(Math.floor(100000000 + Math.random() * 900000000));
  return `${prefix}${digits}`;
}

function randomGroupNumber() {
  return `GRP-${String(Math.floor(10000 + Math.random() * 90000))}`;
}

function randomAddress() {
  const num = 100 + Math.floor(Math.random() * 9900);
  return `${num} ${pick(STREETS)}, ${pick(CITIES)} ${String(10000 + Math.floor(Math.random() * 90000))}`;
}

// ── Public factory ────────────────────────────────────────────────────────────

export function generatePatientData(): PatientData {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const ins = pick(INSURANCES);
  const clinical = pick(CLINICAL);
  const provider = pick(PROVIDERS);

  return {
    firstName,
    lastName,
    dob: randomDob(),
    phone: randomPhone(),
    address: randomAddress(),
    insurance: ins,
    memberId: randomMemberId(ins),
    groupNumber: randomGroupNumber(),
    ...clinical,
    providerName: provider.name,
    providerNpi: provider.npi,
  };
}
