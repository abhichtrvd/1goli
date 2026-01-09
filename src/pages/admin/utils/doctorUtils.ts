// Parser for doctor CSV imports
export function parseDoctorCSV(csvText: string): Array<{
  name: string;
  specialization: string;
  credentials: string;
  experienceYears: number;
  clinicCity: string;
  clinicAddress: string;
  clinicPhone: string;
  bio: string;
  availability?: string;
  languages?: string;
  services?: string;
  imageUrl?: string;
}> {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const doctors = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length < 8) continue; // Skip invalid rows

    const doctor: any = {};

    // Map required fields
    doctor.name = values[0]?.trim() || '';
    doctor.specialization = values[1]?.trim() || '';
    doctor.credentials = values[2]?.trim() || '';
    doctor.experienceYears = parseInt(values[3]) || 0;
    doctor.clinicCity = values[4]?.trim() || '';
    doctor.clinicAddress = values[5]?.trim() || '';
    doctor.clinicPhone = values[6]?.trim() || '';
    doctor.bio = values[7]?.trim() || '';

    // Optional fields
    if (values[8]) doctor.availability = values[8].trim();
    if (values[9]) doctor.languages = values[9].trim();
    if (values[10]) doctor.services = values[10].trim();
    if (values[11]) doctor.imageUrl = values[11].trim();

    // Validate required fields
    if (doctor.name && doctor.specialization && doctor.clinicCity) {
      doctors.push(doctor);
    }
  }

  return doctors;
}

// Helper function to parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map(v => v.replace(/^"|"$/g, ''));
}
