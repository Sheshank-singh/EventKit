import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseSpreadsheetBuffer,
  inferColumnType,
  isValidEmail,
  normalizeKey,
} from '../lib/spreadsheet-parser';
import {
  evaluateRuleCondition,
  isParticipantEligibleForDoc,
  analyzeRuleMatches,
} from '../lib/rule-engine';
import {
  generateCertificateId,
  sanitizeFilename,
  interpolateTokens,
  buildDocumentFilename,
  resolveFieldValue,
} from '../lib/template-engine';
import {
  calculatePdfCoordinates,
  wrapTextToWidth,
  hexToRgb,
} from '../lib/pdf-renderer';
import { validateEventProject } from '../lib/validation-engine';
import { buildCsvReport } from '../lib/zip-exporter';
import { validateAndParseProjectJson } from '../lib/project-storage';
import { createSampleEventProject } from '../lib/sample-data';
import { DocumentType, GenerationRule, Participant, TemplateField } from '../types';

describe('Spreadsheet Parser & Header Detection', () => {
  it('normalizes keys correctly', () => {
    expect(normalizeKey('Full Name ')).toBe('full_name');
    expect(normalizeKey('Email-Address')).toBe('email_address');
    expect(normalizeKey('College / Org.')).toBe('college_org');
  });

  it('infers standard column types accurately', () => {
    expect(inferColumnType('Participant Name')).toBe('full_name');
    expect(inferColumnType('Email ID')).toBe('email');
    expect(inferColumnType('Mobile Number')).toBe('phone');
    expect(inferColumnType('University')).toBe('organization');
    expect(inferColumnType('Event Role')).toBe('role');
    expect(inferColumnType('Award / Position')).toBe('award');
    expect(inferColumnType('Presence / Attendance')).toBe('attendance');
    expect(inferColumnType('Certificate ID')).toBe('certificate_id');
  });

  it('validates email addresses', () => {
    expect(isValidEmail('alice@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('parses XLSX buffer with rows, detecting duplicates and missing names', () => {
    // Generate synthetic Excel buffer in memory
    const wb = XLSX.utils.book_new();
    const data = [
      ['Full Name', 'Email', 'Role', 'Attendance'],
      ['Alice Smith', 'alice@example.com', 'Participant', 'Present'],
      ['Bob Jones', 'bob@example.com', 'Judge', 'Present'],
      ['Alice Smith', 'alice@example.com', 'Participant', 'Present'], // Duplicate!
      ['', 'empty@example.com', 'Participant', 'Present'], // Missing name!
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = parseSpreadsheetBuffer(buf);
    expect(result.sheetNames).toEqual(['Sheet1']);
    expect(result.totalRows).toBe(4);
    expect(result.duplicateCount).toBe(1);
    expect(result.columns.length).toBe(4);

    // Alice duplicate row check
    const duplicateRow = result.participants[2];
    expect(duplicateRow.validationErrors).toBeDefined();
    expect(duplicateRow.validationErrors?.some(e => e.includes('Duplicate'))).toBe(true);

    // Missing name row check
    const missingNameRow = result.participants[3];
    expect(missingNameRow.validationErrors).toBeDefined();
    expect(missingNameRow.validationErrors?.some(e => e.includes('Missing participant name'))).toBe(true);
  });
});

describe('Rule Engine & Conditional Generation', () => {
  const p: Participant = {
    id: 'p1',
    rowNumber: 2,
    data: {
      full_name: 'Charlie Brown',
      role: 'Speaker',
      award: 'First Place',
      attendance: 'Present',
    },
    isExcluded: false,
  };

  it('evaluates Equals operator', () => {
    const rule1: GenerationRule = { id: 'r1', columnKey: 'role', operator: 'equals', value: 'Speaker' };
    const rule2: GenerationRule = { id: 'r2', columnKey: 'role', operator: 'equals', value: 'Judge' };
    expect(evaluateRuleCondition(rule1, p)).toBe(true);
    expect(evaluateRuleCondition(rule2, p)).toBe(false);
  });

  it('evaluates Not Equals operator', () => {
    const rule: GenerationRule = { id: 'r1', columnKey: 'role', operator: 'not_equals', value: 'Participant' };
    expect(evaluateRuleCondition(rule, p)).toBe(true);
  });

  it('evaluates Contains and Is Not Empty operator', () => {
    const ruleContains: GenerationRule = { id: 'r1', columnKey: 'award', operator: 'contains', value: 'Place' };
    const ruleNotEmpty: GenerationRule = { id: 'r2', columnKey: 'award', operator: 'is_not_empty', value: '' };
    const ruleEmpty: GenerationRule = { id: 'r3', columnKey: 'award', operator: 'is_empty', value: '' };

    expect(evaluateRuleCondition(ruleContains, p)).toBe(true);
    expect(evaluateRuleCondition(ruleNotEmpty, p)).toBe(true);
    expect(evaluateRuleCondition(ruleEmpty, p)).toBe(false);
  });

  it('evaluates DocumentType multi-rule AND logic', () => {
    const docType: DocumentType = {
      id: 'dt1',
      name: 'Award Certificate',
      category: 'certificate',
      isEnabled: true,
      template: {} as any,
      fieldMappings: [],
      rules: [
        { id: 'r1', columnKey: 'attendance', operator: 'equals', value: 'Present' },
        { id: 'r2', columnKey: 'award', operator: 'equals', value: 'First Place' },
      ],
    };

    expect(isParticipantEligibleForDoc(docType, p)).toBe(true);

    // If one rule fails, participant is not eligible
    const failingDocType: DocumentType = {
      ...docType,
      rules: [
        { id: 'r1', columnKey: 'attendance', operator: 'equals', value: 'Present' },
        { id: 'r2', columnKey: 'award', operator: 'equals', value: 'Second Place' },
      ],
    };
    expect(isParticipantEligibleForDoc(failingDocType, p)).toBe(false);
  });

  it('analyzes rule match coverage across participants', () => {
    const demo = createSampleEventProject();
    const analysis = analyzeRuleMatches(demo.documentTypes, demo.participants);
    expect(analysis.totalUniqueEligible).toBeGreaterThan(0);
    expect(analysis.docTypeMatches['dt_participation']).toBeGreaterThan(0);
  });
});

describe('Template Engine, Token Interpolation & Filenames', () => {
  it('generates deterministic certificate IDs', () => {
    expect(generateCertificateId('CERT', 1, 4)).toBe('CERT-0001');
    expect(generateCertificateId('HACK-2026', 42, 5)).toBe('HACK-2026-00042');
  });

  it('sanitizes filenames safely', () => {
    expect(sanitizeFilename('Alice / Smith: Winner? <Tech>')).toBe('Alice_Smith_Winner_Tech');
    expect(sanitizeFilename('   Event   2026   ')).toBe('Event_2026');
  });

  it('builds standard filenames by convention', () => {
    const filename = buildDocumentFilename(
      'event_name_doc_id',
      'AI Summit',
      'Dr. John Doe',
      'Speaker Letter',
      'EVT-01'
    );
    expect(filename).toBe('AI_Summit_Dr._John_Doe_Speaker_Letter_EVT-01.pdf');
  });

  it('interpolates string tokens safely', () => {
    const tpl = 'Hello {{full_name}}, welcome to {{event_name}}!';
    const res = interpolateTokens(tpl, {
      full_name: 'Devika',
      event_name: 'HackAI',
    });
    expect(res).toBe('Hello Devika, welcome to HackAI!');
  });
});

describe('PDF Coordinate Transformation & Text Utilities', () => {
  it('translates normalized coordinates to PDF bottom-left system', () => {
    const field: TemplateField = {
      id: 'f1',
      key: 'name',
      name: 'Name',
      x: 0.1, // 10% from left
      y: 0.2, // 20% from top
      width: 0.8,
      height: 0.1,
      fontSize: 24,
      fontFamily: 'Helvetica',
      color: '#000000',
      alignment: 'center',
    };

    const pageWidth = 800;
    const pageHeight = 600;

    const coords = calculatePdfCoordinates(field, pageWidth, pageHeight);
    expect(coords.boxX).toBe(80);
    expect(coords.boxWidth).toBe(640);
    expect(coords.boxHeight).toBe(60);
    // In top-down coords, box spans y = 120 to 180.
    // In PDF coords, box spans y = 600 - 180 = 420 to 600 - 120 = 480.
    expect(coords.boxBottomY).toBe(420);
    expect(coords.boxTopY).toBe(480);
  });

  it('converts hex to pdf-lib rgb', () => {
    const black = hexToRgb('#000000');
    expect(black.red).toBe(0);
    expect(black.green).toBe(0);
    expect(black.blue).toBe(0);

    const white = hexToRgb('#ffffff');
    expect(white.red).toBe(1);
    expect(white.green).toBe(1);
    expect(white.blue).toBe(1);
  });
});

describe('Validation Engine & Reporting', () => {
  it('validates a complete project without blocking errors', () => {
    const demo = createSampleEventProject();
    const result = validateEventProject(demo);
    expect(result.hasBlockingErrors).toBe(false);
    expect(result.errorCount).toBe(0);
    expect(result.expectedDocumentsCount).toBeGreaterThan(0);
  });

  it('catches missing event name as blocking error', () => {
    const demo = createSampleEventProject();
    demo.metadata.name = '';
    const result = validateEventProject(demo);
    expect(result.hasBlockingErrors).toBe(true);
    expect(result.issues.some(i => i.id === 'err_event_name_missing')).toBe(true);
  });

  it('builds generation CSV report with proper escaping', () => {
    const csv = buildCsvReport({
      projectId: 'p1',
      eventName: 'Tech, Conf "2026"',
      timestamp: '2026-10-10',
      totalParticipants: 2,
      totalEligible: 2,
      totalGenerated: 2,
      totalFailed: 0,
      totalExcluded: 0,
      totalSkipped: 0,
      items: [
        {
          rowNumber: 2,
          participantName: 'Alice, Joy',
          email: 'alice@example.com',
          documentType: 'Certificate',
          certificateId: 'CERT-01',
          filename: 'Alice_Certificate.pdf',
          status: 'SUCCESS',
        },
      ],
    });

    expect(csv).toContain('"Alice, Joy"');
    expect(csv).toContain('SUCCESS');
    expect(csv).toContain('CERT-01');
  });

  it('validates imported JSON project structure', () => {
    const demo = createSampleEventProject();
    const jsonStr = JSON.stringify(demo);
    const parsed = validateAndParseProjectJson(jsonStr);
    expect(parsed.metadata.name).toBe(demo.metadata.name);
    expect(parsed.participants.length).toBe(demo.participants.length);

    expect(() => validateAndParseProjectJson('invalid json')).toThrow();
    expect(() => validateAndParseProjectJson('{}')).toThrow();
  });
});
