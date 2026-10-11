import JSZip from 'jszip';
import { GeneratedDocument, GenerationReport } from '../types';
import { sanitizeFilename } from './template-engine';

/**
 * Maps document category to standardized subfolder name.
 */
export function getCategorySubfolder(category: string): string {
  switch (category) {
    case 'certificate':
      return 'Certificates';
    case 'letter':
      return 'Letters';
    case 'id_card':
      return 'ID-Cards';
    case 'attendance':
      return 'Attendance';
    default:
      return 'Custom-Documents';
  }
}

/**
 * Formats CSV generation report text.
 */
export function buildCsvReport(report: GenerationReport): string {
  const headers = [
    'Row Number',
    'Participant Name',
    'Email',
    'Document Type',
    'Certificate ID',
    'Filename',
    'Status',
    'Error / Notes',
  ];

  const escapeCsv = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];

  report.items.forEach(item => {
    lines.push(
      [
        item.rowNumber,
        escapeCsv(item.participantName),
        escapeCsv(item.email),
        escapeCsv(item.documentType),
        escapeCsv(item.certificateId),
        escapeCsv(item.filename),
        item.status,
        escapeCsv(item.reason || ''),
      ].join(',')
    );
  });

  return lines.join('\r\n');
}

/**
 * Creates structured ZIP archive of all successfully generated documents and reports.
 */
export async function createBatchZip({
  eventName,
  documents,
  report,
  includeFolders = true,
  printableA4IdSheetBytes,
}: {
  eventName: string;
  documents: GeneratedDocument[];
  report: GenerationReport;
  includeFolders?: boolean;
  printableA4IdSheetBytes?: Uint8Array;
}): Promise<Blob> {
  const zip = new JSZip();
  const rootFolderName = sanitizeFilename(eventName || 'EventKit_Export');
  const root = zip.folder(rootFolderName) || zip;

  const usedPaths = new Set<string>();

  // Add generated PDFs
  for (const doc of documents) {
    if (doc.status !== 'success' || !doc.pdfBytes) continue;

    const subfolder = includeFolders
      ? doc.subfolder || getCategorySubfolder(doc.documentCategory)
      : '';

    const folder = subfolder ? root.folder(subfolder) || root : root;

    // Guard against identical filenames inside the same folder
    let finalFilename = doc.filename;
    let collisionCount = 1;
    let fullPath = subfolder ? `${subfolder}/${finalFilename}` : finalFilename;

    while (usedPaths.has(fullPath)) {
      const extIndex = doc.filename.lastIndexOf('.');
      const base = extIndex >= 0 ? doc.filename.substring(0, extIndex) : doc.filename;
      const ext = extIndex >= 0 ? doc.filename.substring(extIndex) : '.pdf';
      finalFilename = `${base}_${collisionCount}${ext}`;
      fullPath = subfolder ? `${subfolder}/${finalFilename}` : finalFilename;
      collisionCount++;
    }
    usedPaths.add(fullPath);

    folder.file(finalFilename, doc.pdfBytes);
  }

  // If printable A4 ID sheet is supplied, add it directly to ID-Cards folder
  if (printableA4IdSheetBytes) {
    const idFolder = includeFolders ? root.folder('ID-Cards') || root : root;
    idFolder.file('A4_Printable_ID_Cards_All.pdf', printableA4IdSheetBytes);
  }

  // Add reports folder
  const reportsFolder = includeFolders ? root.folder('reports') || root : root;

  // 1. CSV Report
  const csvContent = buildCsvReport(report);
  reportsFolder.file('generation_report.csv', csvContent);

  // 2. JSON Manifest
  const manifestContent = JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      eventName: report.eventName,
      summary: {
        totalEligible: report.totalEligible,
        totalGenerated: report.totalGenerated,
        totalFailed: report.totalFailed,
        totalExcluded: report.totalExcluded,
      },
      files: documents.map(d => ({
        participant: d.participantName,
        documentType: d.documentTypeName,
        filename: d.filename,
        certificateId: d.certificateId,
        status: d.status,
      })),
    },
    null,
    2
  );
  reportsFolder.file('manifest.json', manifestContent);

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Triggers a browser file download for a given Blob or Uint8Array.
 */
export function triggerFileDownload(
  data: Blob | Uint8Array,
  filename: string,
  mimeType: string = 'application/octet-stream'
) {
  const blob = data instanceof Blob ? data : new Blob([data as any], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
