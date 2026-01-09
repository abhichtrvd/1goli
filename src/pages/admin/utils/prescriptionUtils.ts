import { parseCSVLine } from "./csvHelpers";

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

// Common medicine database for validation
const COMMON_MEDICINES = [
  "Paracetamol", "Ibuprofen", "Aspirin", "Amoxicillin", "Azithromycin",
  "Ciprofloxacin", "Metformin", "Atorvastatin", "Omeprazole", "Pantoprazole",
  "Levothyroxine", "Amlodipine", "Lisinopril", "Metoprolol", "Losartan",
  "Simvastatin", "Clopidogrel", "Warfarin", "Insulin", "Methotrexate",
  "Prednisone", "Dexamethasone", "Cetirizine", "Loratadine", "Montelukast",
  "Salbutamol", "Albuterol", "Fluticasone", "Budesonide", "Diphenhydramine",
  "Ranitidine", "Famotidine", "Diclofenac", "Naproxen", "Tramadol",
  "Codeine", "Morphine", "Fentanyl", "Gabapentin", "Pregabalin",
  "Sertraline", "Fluoxetine", "Escitalopram", "Citalopram", "Paroxetine",
  "Venlafaxine", "Duloxetine", "Amitriptyline", "Mirtazapine", "Bupropion",
  "Alprazolam", "Lorazepam", "Diazepam", "Clonazepam", "Zolpidem",
  "Furosemide", "Spironolactone", "Hydrochlorothiazide", "Ramipril", "Enalapril",
  "Bisoprolol", "Carvedilol", "Digoxin", "Verapamil", "Diltiazem"
];

export const validateMedicine = (medicineName: string): {
  isValid: boolean;
  suggestion?: string;
} => {
  if (!medicineName || medicineName.trim().length === 0) {
    return { isValid: false, suggestion: "Medicine name is required" };
  }

  const name = medicineName.trim().toLowerCase();

  // Check if medicine exists in common database
  const found = COMMON_MEDICINES.find(med =>
    med.toLowerCase() === name ||
    med.toLowerCase().includes(name) ||
    name.includes(med.toLowerCase())
  );

  if (!found) {
    // Find similar medicines for suggestions
    const similar = COMMON_MEDICINES.filter(med => {
      const medLower = med.toLowerCase();
      const nameLower = name.toLowerCase();
      return medLower.startsWith(nameLower[0]) &&
             (medLower.includes(nameLower.substring(0, 3)) ||
              nameLower.includes(medLower.substring(0, 3)));
    });

    if (similar.length > 0) {
      return {
        isValid: false,
        suggestion: `Medicine not found in database. Did you mean: ${similar.slice(0, 3).join(", ")}?`
      };
    }

    return {
      isValid: false,
      suggestion: "Medicine not found in common database. Please verify the spelling."
    };
  }

  return { isValid: true };
};

export interface PrescriptionCSVRow {
  patientEmail?: string;
  patientName?: string;
  patientPhone?: string;
  doctorName: string;
  medicines: string; // JSON string
  diagnosis?: string;
  expiryDate?: string;
}

export const validateMedicineObject = (medicine: Medicine): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!medicine.name || medicine.name.trim().length === 0) {
    errors.push("Medicine name is required");
  }

  if (!medicine.dosage || medicine.dosage.trim().length === 0) {
    errors.push("Dosage is required");
  }

  if (!medicine.frequency || medicine.frequency.trim().length === 0) {
    errors.push("Frequency is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateMedicineList = (medicines: Medicine[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (medicines.length === 0) {
    return { valid: true, errors }; // Empty is valid (optional)
  }

  medicines.forEach((medicine, index) => {
    const validation = validateMedicineObject(medicine);
    if (!validation.valid) {
      errors.push(`Medicine ${index + 1}: ${validation.errors.join(", ")}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const parsePrescriptionCSV = (csvContent: string): { data: PrescriptionCSVRow[]; errors: string[] } => {
  const lines = csvContent.trim().split("\n");
  const errors: string[] = [];
  const data: PrescriptionCSVRow[] = [];

  if (lines.length < 2) {
    return { data: [], errors: ["CSV file must contain at least a header row and one data row"] };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

  // Validate required columns
  const requiredColumns = ["doctorname", "medicines"];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));

  if (missingColumns.length > 0) {
    return {
      data: [],
      errors: [`Missing required columns: ${missingColumns.join(", ")}. Required: doctorName, medicines`]
    };
  }

  // Get column indices
  const patientEmailIdx = headers.indexOf("patientemail");
  const patientNameIdx = headers.indexOf("patientname");
  const patientPhoneIdx = headers.indexOf("patientphone");
  const doctorNameIdx = headers.indexOf("doctorname");
  const medicinesIdx = headers.indexOf("medicines");
  const diagnosisIdx = headers.indexOf("diagnosis");
  const expiryDateIdx = headers.indexOf("expirydate");

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    try {
      const values = parseCSVLine(line);

      const patientEmail = patientEmailIdx >= 0 ? (values[patientEmailIdx]?.trim() || "") : "";
      const patientName = patientNameIdx >= 0 ? (values[patientNameIdx]?.trim() || "") : "";
      const patientPhone = patientPhoneIdx >= 0 ? (values[patientPhoneIdx]?.trim() || "") : "";
      const doctorName = values[doctorNameIdx]?.trim() || "";
      const medicines = values[medicinesIdx]?.trim() || "";
      const diagnosis = diagnosisIdx >= 0 ? (values[diagnosisIdx]?.trim() || "") : "";
      const expiryDate = expiryDateIdx >= 0 ? (values[expiryDateIdx]?.trim() || "") : "";

      // Validate required fields
      if (!doctorName) {
        errors.push(`Row ${i + 1}: Doctor name is required`);
        continue;
      }

      if (!medicines) {
        errors.push(`Row ${i + 1}: Medicines field is required`);
        continue;
      }

      if (!patientEmail && !patientPhone && !patientName) {
        errors.push(`Row ${i + 1}: At least one of patientEmail, patientPhone, or patientName is required`);
        continue;
      }

      data.push({
        patientEmail: patientEmail || undefined,
        patientName: patientName || undefined,
        patientPhone: patientPhone || undefined,
        doctorName,
        medicines,
        diagnosis: diagnosis || undefined,
        expiryDate: expiryDate || undefined,
      });
    } catch (error) {
      errors.push(`Row ${i + 1}: Failed to parse line - ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return { data, errors };
};

export const isExpiryWarning = (expiryDate: number | undefined): boolean => {
  if (!expiryDate) return false;

  const now = Date.now();
  const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);

  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
};

export const isExpired = (expiryDate: number | undefined): boolean => {
  if (!expiryDate) return false;
  return Date.now() > expiryDate;
};

export const getExpiryStatus = (expiryDate: number | undefined): {
  status: "valid" | "warning" | "expired";
  message: string;
  daysRemaining?: number;
} => {
  if (!expiryDate) {
    return { status: "valid", message: "No expiry date set" };
  }

  const now = Date.now();
  const daysRemaining = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: "expired",
      message: `Expired ${Math.abs(daysRemaining)} days ago`,
      daysRemaining: 0
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: "warning",
      message: `Expires in ${daysRemaining} days`,
      daysRemaining
    };
  }

  return {
    status: "valid",
    message: `Valid for ${daysRemaining} days`,
    daysRemaining
  };
};

export const generatePrescriptionCSVTemplate = (): string => {
  const headers = ["patientEmail", "patientName", "patientPhone", "doctorName", "medicines", "diagnosis", "expiryDate"];
  const medicinesExample = JSON.stringify([
    { name: "Paracetamol", dosage: "500mg", frequency: "Twice daily", duration: "7 days" },
    { name: "Ibuprofen", dosage: "400mg", frequency: "Thrice daily", duration: "5 days" }
  ]);
  const exampleRow = [
    "patient@example.com",
    "John Doe",
    "+1234567890",
    "Dr. Smith",
    medicinesExample,
    "Fever and body pain",
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
  ];

  return [headers.join(","), exampleRow.map(v => `"${v.replace(/"/g, '""')}"`).join(",")].join("\n");
};
