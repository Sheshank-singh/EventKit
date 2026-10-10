import {
  EventMetadata,
  FieldMapping,
  Participant,
  TemplateField,
  NamingConvention,
  ProjectSettings,
} from '../types';

/**
 * Generates a deterministic formatted Certificate ID.
 */
export function generateCertificateId(
  prefix: string,
  index: number,
  padding: number = 4
): string {
  const cleanPrefix = (prefix || 'CERT').trim();
  const numStr = String(index).padStart(padding, '0');
  return `${cleanPrefix}-${numStr}`;
}

/**
 * Sanitizes a string for use in filenames across Windows, macOS, and Linux.
 */
export function sanitizeFilename(name: string): string {
  if (!name) return 'document';
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Remove illegal filename characters
    .replace(/\s+/g, '_') // Replace whitespace with underscore
    .replace(/_{2,}/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, '') // Trim leading/trailing underscores
    .slice(0, 120); // Guard against overly long filenames
}

/**
 * Converts a string to Title Case.
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

/**
 * Evaluates the mapped value for a template field based on participant data,
 * event metadata, static text, or computed certificate ID.
 */
export function resolveFieldValue(
  field: TemplateField,
  mapping: FieldMapping | undefined,
  participant: Participant,
  metadata: EventMetadata,
  certificateId: string
): string {
  // Static field defined in template directly
  if (field.isStatic && field.staticText !== undefined) {
    return field.staticText;
  }

  // If no mapping provided, fall back to checking if field.key matches participant data directly
  if (!mapping) {
    if (field.key === 'certificate_id') return certificateId;
    if (field.key === 'event_name') return metadata.name;
    if (field.key === 'organizer') return metadata.organizer;
    if (field.key === 'event_date') {
      return metadata.startDate === metadata.endDate || !metadata.endDate
        ? metadata.startDate
        : `${metadata.startDate} to ${metadata.endDate}`;
    }
    const directVal = participant.data[field.key];
    return directVal !== undefined ? String(directVal) : '';
  }

  let rawValue = '';

  switch (mapping.source) {
    case 'participant_column':
      if (mapping.columnKey) {
        rawValue = participant.data[mapping.columnKey] ?? '';
      }
      break;

    case 'event_metadata':
      if (mapping.metadataField === 'eventName') rawValue = metadata.name;
      else if (mapping.metadataField === 'organizer') rawValue = metadata.organizer;
      else if (mapping.metadataField === 'startDate') rawValue = metadata.startDate;
      else if (mapping.metadataField === 'endDate') rawValue = metadata.endDate;
      else if (mapping.metadataField === 'location') rawValue = metadata.location;
      else if (mapping.metadataField === 'eventType') rawValue = toTitleCase(metadata.eventType.replace('_', ' '));
      break;

    case 'static':
      rawValue = mapping.staticValue ?? '';
      break;

    case 'computed_cert_id':
      rawValue = certificateId;
      break;

    default:
      rawValue = '';
  }

  // Apply optional string transform format pattern
  if (mapping.formatPattern === 'uppercase') {
    return rawValue.toUpperCase();
  } else if (mapping.formatPattern === 'lowercase') {
    return rawValue.toLowerCase();
  } else if (mapping.formatPattern === 'titlecase') {
    return toTitleCase(rawValue);
  }

  return rawValue;
}

/**
 * Replaces `{{variable}}` tokens in a template string safely.
 */
export function interpolateTokens(
  templateStr: string,
  variables: Record<string, string>
): string {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] !== undefined ? variables[key] : `{{${key}}}`;
  });
}

/**
 * Builds standard output filename according to project naming convention.
 */
export function buildDocumentFilename(
  convention: NamingConvention,
  eventName: string,
  participantName: string,
  docTypeName: string,
  certificateId: string
): string {
  const safeEvent = sanitizeFilename(eventName || 'Event');
  const safeName = sanitizeFilename(participantName || 'Participant');
  const safeDoc = sanitizeFilename(docTypeName || 'Document');
  const safeId = sanitizeFilename(certificateId || 'ID');

  let baseName = '';
  switch (convention) {
    case 'event_name_doc_id':
      baseName = `${safeEvent}_${safeName}_${safeDoc}_${safeId}`;
      break;
    case 'name_doc_event':
      baseName = `${safeName}_${safeDoc}_${safeEvent}`;
      break;
    case 'doc_name_id':
      baseName = `${safeDoc}_${safeName}_${safeId}`;
      break;
    case 'id_name':
      baseName = `${safeId}_${safeName}`;
      break;
    default:
      baseName = `${safeEvent}_${safeName}_${safeDoc}_${safeId}`;
  }

  return `${baseName}.pdf`;
}
