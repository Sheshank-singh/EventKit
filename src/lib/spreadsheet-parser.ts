import * as XLSX from 'xlsx';
import { Participant, ParticipantColumn, MappedStandardColumn } from '../types';

export interface ParseResult {
  sheetNames: string[];
  selectedSheet: string;
  columns: ParticipantColumn[];
  participants: Participant[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateCount: number;
}

/**
 * Normalizes string keys by lowercasing and trimming, replacing spaces/hyphens with underscores.
 */
export function normalizeKey(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Heuristically infers the standard column type based on header name.
 */
export function inferColumnType(header: string): MappedStandardColumn {
  const norm = normalizeKey(header);

  if (norm.includes('name') || norm === 'fullname' || norm === 'participant_name' || norm === 'student_name') {
    return 'full_name';
  }
  if (norm.includes('email') || norm === 'mail' || norm === 'email_id' || norm === 'e_mail') {
    return 'email';
  }
  if (norm.includes('phone') || norm.includes('mobile') || norm.includes('contact') || norm === 'tel') {
    return 'phone';
  }
  if (norm.includes('org') || norm.includes('college') || norm.includes('university') || norm.includes('company') || norm.includes('school') || norm.includes('institute')) {
    return 'organization';
  }
  if (norm.includes('role') || norm.includes('designation') || norm === 'type') {
    return 'role';
  }
  if (norm.includes('category') || norm.includes('track') || norm.includes('department') || norm.includes('stream')) {
    return 'category';
  }
  if (norm.includes('award') || norm.includes('prize') || norm.includes('position') || norm.includes('rank') || norm.includes('winner')) {
    return 'award';
  }
  if (norm.includes('attend') || norm.includes('status') || norm === 'presence') {
    return 'attendance';
  }
  if (norm.includes('cert') || norm.includes('id') || norm.includes('reg') || norm.includes('ticket')) {
    return 'certificate_id';
  }
  return 'custom';
}

/**
 * Validates basic email format (without rejecting valid edge-case addresses).
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Parses file ArrayBuffer / Uint8Array into participant dataset.
 */
export function parseSpreadsheetBuffer(
  buffer: ArrayBuffer | Uint8Array,
  sheetIndexOrName?: number | string
): ParseResult {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: false, // Read formatted text strings
    cellDates: true,
  });

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Spreadsheet has no readable sheets.');
  }

  let selectedSheetName = sheetNames[0];
  if (typeof sheetIndexOrName === 'string' && sheetNames.includes(sheetIndexOrName)) {
    selectedSheetName = sheetIndexOrName;
  } else if (typeof sheetIndexOrName === 'number' && sheetNames[sheetIndexOrName]) {
    selectedSheetName = sheetNames[sheetIndexOrName];
  }

  const worksheet = workbook.Sheets[selectedSheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${selectedSheetName}" could not be loaded.`);
  }

  // Convert to 2D array to inspect headers & data
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawRows || rawRows.length === 0) {
    return {
      sheetNames,
      selectedSheet: selectedSheetName,
      columns: [],
      participants: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateCount: 0,
    };
  }

  // Find header row (first non-empty row)
  let headerRowIndex = 0;
  while (headerRowIndex < rawRows.length && (!rawRows[headerRowIndex] || rawRows[headerRowIndex].length === 0)) {
    headerRowIndex++;
  }

  if (headerRowIndex >= rawRows.length) {
    return {
      sheetNames,
      selectedSheet: selectedSheetName,
      columns: [],
      participants: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateCount: 0,
    };
  }

  const rawHeaders = rawRows[headerRowIndex].map((h: any, idx: number) => {
    const str = String(h ?? '').trim();
    return str || `Column_${idx + 1}`;
  });

  // Extract columns with sample values
  const columns: ParticipantColumn[] = rawHeaders.map((header, colIdx) => {
    const key = normalizeKey(header) || `col_${colIdx + 1}`;
    const sampleValues: string[] = [];
    for (let r = headerRowIndex + 1; r < Math.min(headerRowIndex + 6, rawRows.length); r++) {
      const val = String(rawRows[r]?.[colIdx] ?? '').trim();
      if (val) sampleValues.push(val);
    }
    return {
      key,
      originalHeader: header,
      mappedType: inferColumnType(header),
      sampleValues,
    };
  });

  // Parse participant records
  const participants: Participant[] = [];
  const seenIdentities = new Map<string, number>(); // identity -> count
  let duplicateCount = 0;

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.every((c: any) => String(c ?? '').trim() === '')) {
      continue; // Skip truly blank rows
    }

    const rowData: Record<string, string> = {};
    columns.forEach((col, colIdx) => {
      const cellVal = row[colIdx];
      rowData[col.key] = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
    });

    const rowNumber = r + 1; // 1-indexed spreadsheet row
    const validationErrors: string[] = [];

    // Identify primary name & email
    const nameCol = columns.find(c => c.mappedType === 'full_name');
    const emailCol = columns.find(c => c.mappedType === 'email');

    const nameVal = nameCol ? rowData[nameCol.key] : '';
    const emailVal = emailCol ? rowData[emailCol.key] : '';

    if (nameCol && !nameVal) {
      validationErrors.push('Missing participant name');
    }

    if (emailCol && emailVal && !isValidEmail(emailVal)) {
      validationErrors.push(`Invalid email format: "${emailVal}"`);
    }

    // Duplicate detection based on email or name
    const identityKey = emailVal
      ? `email:${emailVal.toLowerCase()}`
      : nameVal
      ? `name:${nameVal.toLowerCase()}`
      : `row:${rowNumber}`;

    const prevCount = seenIdentities.get(identityKey) || 0;
    seenIdentities.set(identityKey, prevCount + 1);
    if (prevCount > 0) {
      duplicateCount++;
      validationErrors.push(`Duplicate record detected (${prevCount + 1} occurrences)`);
    }

    const internalId = `p_${rowNumber}_${Math.random().toString(36).substring(2, 9)}`;

    participants.push({
      id: internalId,
      rowNumber,
      data: rowData,
      isExcluded: false,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    });
  }

  const validRows = participants.filter(p => !p.validationErrors || p.validationErrors.length === 0).length;
  const invalidRows = participants.length - validRows;

  return {
    sheetNames,
    selectedSheet: selectedSheetName,
    columns,
    participants,
    totalRows: participants.length,
    validRows,
    invalidRows,
    duplicateCount,
  };
}

/**
 * Generates an empty participant row for inline addition.
 */
export function createEmptyParticipant(columns: ParticipantColumn[], rowNumber: number): Participant {
  const data: Record<string, string> = {};
  columns.forEach(col => {
    data[col.key] = '';
  });
  return {
    id: `p_new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    rowNumber,
    data,
    isExcluded: false,
  };
}
