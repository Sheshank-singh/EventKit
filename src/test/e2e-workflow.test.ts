import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseSpreadsheetBuffer } from '../lib/spreadsheet-parser';
import {
  evaluateRuleCondition,
  isParticipantEligibleForDoc,
  analyzeRuleMatches,
} from '../lib/rule-engine';
import { renderSingleDocument } from '../lib/pdf-renderer';
import { createBatchZip } from '../lib/zip-exporter';
import { validateEventProject } from '../lib/validation-engine';
import { saveProject, loadProject } from '../lib/project-storage';
import { createSampleEventProject } from '../lib/sample-data';
import { getBuiltinTemplates } from '../lib/builtin-templates';
import { DocumentType, EventProject, Participant } from '../types';

describe('End-to-End Workflow & Edge Cases Test Suite', () => {
  const builtinTemplates = getBuiltinTemplates();

  // Test Case 1: A valid participant spreadsheet
  it('1. Valid participant spreadsheet parsing and field identification', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['Full Name', 'Email', 'Role', 'Attendance'],
      ['Priya Sharma', 'priya@college.edu', 'Participant', 'Present'],
      ['Karthik Verma', 'karthik@college.edu', 'Participant', 'Present'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = parseSpreadsheetBuffer(buf);
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(0);
    expect(result.participants[0].data.full_name).toBe('Priya Sharma');
  });

  // Test Case 2: A spreadsheet with missing names
  it('2. Spreadsheet with missing participant names flags validation errors without dropping rows', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['Full Name', 'Email', 'Role'],
      ['', 'anonymous@college.edu', 'Participant'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = parseSpreadsheetBuffer(buf);
    expect(result.totalRows).toBe(1);
    expect(result.invalidRows).toBe(1);
    expect(result.participants[0].validationErrors).toBeDefined();
    expect(result.participants[0].validationErrors![0]).toContain('Missing participant name');
  });

  // Test Case 3: Duplicate participant rows
  it('3. Duplicate participant rows are flagged and counted', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['Full Name', 'Email', 'Role'],
      ['Sameer Joshi', 'sameer@test.com', 'Participant'],
      ['Sameer Joshi', 'sameer@test.com', 'Participant'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = parseSpreadsheetBuffer(buf);
    expect(result.totalRows).toBe(2);
    expect(result.duplicateCount).toBe(1);
    expect(result.participants[1].validationErrors?.some(e => e.includes('Duplicate'))).toBe(true);
  });

  // Test Case 4: Different roles requiring different document types
  it('4. Different roles accurately match specific document types', () => {
    const demo = createSampleEventProject();
    const certDoc = demo.documentTypes.find(d => d.id === 'dt_participation')!;
    const letterDoc = demo.documentTypes.find(d => d.id === 'dt_letter')!;

    const attendeeParticipant = demo.participants.find(p => p.data.role === 'Participant')!;
    const judgeParticipant = demo.participants.find(p => p.data.role === 'Judge')!;

    // Attendee should get participation certificate, but not speaker/judge letter
    expect(isParticipantEligibleForDoc(certDoc, attendeeParticipant)).toBe(true);
    expect(isParticipantEligibleForDoc(letterDoc, attendeeParticipant)).toBe(false);

    // Judge should get letter, but not standard participant certificate if rules separate them
    expect(isParticipantEligibleForDoc(letterDoc, judgeParticipant)).toBe(true);
  });

  // Test Case 5: Template with long participant names renders without throwing
  it('5. Handles long names with text wrapping/shrinking gracefully in PDF rendering', async () => {
    const template = builtinTemplates[0]; // Participation cert
    const longNameParticipant: Participant = {
      id: 'p_long',
      rowNumber: 1,
      data: {
        full_name: 'Dr. Professor Alexander Bartholomew Constantine Montgomery III Jr.',
        event_name: 'Super Advanced International Quantum Computing Symposium 2026',
      },
      isExcluded: false,
    };

    const pdfBytes = await renderSingleDocument({
      template,
      mappings: [
        { fieldId: 'f_full_name', fieldKey: 'full_name', source: 'participant_column', columnKey: 'full_name' },
      ],
      participant: longNameParticipant,
      metadata: {
        name: 'Quantum Symposium 2026',
        organizer: 'Apex Research Institute',
        eventType: 'conference',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        location: 'Main Auditorium',
        isOnline: false,
      },
      certificateId: 'LONG-NAME-001',
    });

    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(1000);
  });

  // Test Case 6: Batch with one failed document and other successful documents
  it('6. Batch packaging handles successes and reports failures without crashing', async () => {
    const zipBlob = await createBatchZip({
      eventName: 'Resilience Test Event',
      documents: [
        {
          id: 'doc1',
          participantId: 'p1',
          participantName: 'Alice',
          documentTypeId: 'dt1',
          documentTypeName: 'Certificate',
          documentCategory: 'certificate',
          filename: 'Alice_Certificate.pdf',
          subfolder: 'Certificates',
          certificateId: 'RES-01',
          status: 'success',
          pdfBytes: new Uint8Array([37, 80, 68, 70]), // %PDF dummy
        },
        {
          id: 'doc2',
          participantId: 'p2',
          participantName: 'Bob',
          documentTypeId: 'dt1',
          documentTypeName: 'Certificate',
          documentCategory: 'certificate',
          filename: 'Bob_Certificate.pdf',
          subfolder: 'Certificates',
          certificateId: 'RES-02',
          status: 'failed',
          errorMessage: 'Corrupt template stream',
        },
      ],
      report: {
        projectId: 'proj_resilience',
        eventName: 'Resilience Test Event',
        timestamp: '2026-10-10',
        totalParticipants: 2,
        totalEligible: 2,
        totalGenerated: 1,
        totalFailed: 1,
        totalExcluded: 0,
        totalSkipped: 0,
        items: [
          {
            rowNumber: 2,
            participantName: 'Alice',
            email: 'alice@test.com',
            documentType: 'Certificate',
            certificateId: 'RES-01',
            filename: 'Alice_Certificate.pdf',
            status: 'SUCCESS',
          },
          {
            rowNumber: 3,
            participantName: 'Bob',
            email: 'bob@test.com',
            documentType: 'Certificate',
            certificateId: 'RES-02',
            filename: 'Bob_Certificate.pdf',
            status: 'FAILED',
            reason: 'Corrupt template stream',
          },
        ],
      },
    });

    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);
  });

  // Test Case 7: Saving and reopening a project
  it('7. Project can be saved and reopened intact', async () => {
    const demo = createSampleEventProject();
    demo.id = 'e2e_test_proj_save_load';
    await saveProject(demo);

    const reloaded = await loadProject('e2e_test_proj_save_load');
    expect(reloaded).toBeDefined();
    expect(reloaded?.metadata.name).toBe(demo.metadata.name);
    expect(reloaded?.participants.length).toBe(demo.participants.length);
    expect(reloaded?.documentTypes.length).toBe(demo.documentTypes.length);
  });
});
