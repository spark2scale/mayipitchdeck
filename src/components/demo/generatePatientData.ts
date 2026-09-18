// ─── Patient Data Generator ──────────────────────────────────────────────────
// Produces realistic-looking (but entirely fake) front-desk intake data.

export interface PatientData {
  // Demographics
  firstName: string;
  lastName: string;
  dob: string;         // MM/DD/YYYY
  phone: string;
  address: string;
  emergencyContact: string;
  preferredPharmacy: string;
  // Visit
  reasonForVisit: string;
  referringProvider: string;
  // Insurance
  insurance: string;
  memberId: string;
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

const REASONS_FOR_VISIT = [
  "New patient consult",
  "Annual wellness exam",
  "Follow-up on prior visit",
  "Referral for specialist evaluation",
  "Persistent joint pain",
  "Routine screening",
];

const PHARMACIES = [
  "CVS Pharmacy #4021",
  "Walgreens #1188",
  "Walmart Pharmacy #302",
  "Kroger Pharmacy #77",
  "Costco Pharmacy #519",
];

const PROVIDERS = [
  "Dr. Emily Chen, MD",
  "Dr. Marcus Webb, DO",
  "Dr. Sarah Okonkwo, MD",
  "Dr. James Patel, MD",
  "Dr. Lauren Tran, MD",
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

function randomAddress() {
  const num = 100 + Math.floor(Math.random() * 9900);
  return `${num} ${pick(STREETS)}, ${pick(CITIES)} ${String(10000 + Math.floor(Math.random() * 90000))}`;
}

function randomEmergencyContact(lastName: string) {
  const firstName = pick(FIRST_NAMES);
  const relations = ["Spouse", "Parent", "Sibling", "Adult Child", "Friend"];
  return `${firstName} ${lastName} (${pick(relations)}) — ${randomPhone()}`;
}

// ── Public factory ────────────────────────────────────────────────────────────

export function generatePatientData(): PatientData {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const ins = pick(INSURANCES);

  return {
    firstName,
    lastName,
    dob: randomDob(),
    phone: randomPhone(),
    address: randomAddress(),
    emergencyContact: randomEmergencyContact(lastName),
    preferredPharmacy: pick(PHARMACIES),
    reasonForVisit: pick(REASONS_FOR_VISIT),
    referringProvider: pick(PROVIDERS),
    insurance: ins,
    memberId: randomMemberId(ins),
  };
}
