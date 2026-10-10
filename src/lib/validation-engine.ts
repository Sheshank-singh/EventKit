import {
  EventProject,
  ValidationIssue,
  DocumentType,
  Participant,
} from '../types';
import { isParticipantEligibleForDoc } from './rule-engine';

export interface ValidationSummary {
  issues: ValidationIssue[];
  hasBlockingErrors: boolean;
  errorCount: number;
  warningCount: number;
  totalParticipants: number;
  eligibleCount: number;
  excludedCount: number;
  expectedDocumentsCount: number;
}

/**
 * Validates the entire EventProject configuration prior to bulk generation.
 */
export function validateEventProject(project: EventProject): ValidationSummary {
  const issues: ValidationIssue[] = [];

  // 1. Event Metadata Checks
  if (!project.metadata.name || project.metadata.name.trim() === '') {
    issues.push({
      id: 'err_event_name_missing',
      severity: 'error',
      message: 'Event name is required.',
      detail: 'Please provide an event name in Step 1.',
    });
  }

  if (project.metadata.startDate && project.metadata.endDate) {
    if (new Date(project.metadata.startDate) > new Date(project.metadata.endDate)) {
      issues.push({
        id: 'err_date_range_invalid',
        severity: 'error',
        message: 'Event start date cannot be later than end date.',
      });
    }
  }

  // 2. Participant Dataset Checks
  const allParticipants = project.participants || [];
  const activeParticipants = allParticipants.filter(p => !p.isExcluded);

  if (allParticipants.length === 0) {
    issues.push({
      id: 'err_no_participants',
      severity: 'error',
      message: 'No participant data imported.',
      detail: 'Please import a spreadsheet (.xlsx, .xls, .csv) in Step 2.',
    });
  } else if (activeParticipants.length === 0) {
    issues.push({
      id: 'err_all_participants_excluded',
      severity: 'error',
      message: 'All participants are currently excluded.',
      detail: 'At least one participant must be active to generate documents.',
    });
  }

  // 3. Document Types Checks
  const enabledDocTypes = (project.documentTypes || []).filter(dt => dt.isEnabled);

  if (enabledDocTypes.length === 0) {
    issues.push({
      id: 'err_no_enabled_doctype',
      severity: 'error',
      message: 'No active document types configured.',
      detail: 'Enable at least one document type (Certificate, Letter, or ID Card) in Step 3.',
    });
  }

  // Column keys lookup
  const columnKeys = new Set(project.columns.map(c => c.key));

  // 4. Per Document Type Checks
  let totalExpectedDocs = 0;

  for (const docType of enabledDocTypes) {
    if (!docType.template) {
      issues.push({
        id: `err_dt_${docType.id}_no_template`,
        severity: 'error',
        message: `Document type "${docType.name}" has no template assigned.`,
        documentTypeId: docType.id,
        documentTypeName: docType.name,
      });
      continue;
    }

    if (!docType.template.fields || docType.template.fields.length === 0) {
      issues.push({
        id: `err_dt_${docType.id}_no_fields`,
        severity: 'warning',
        message: `Template for "${docType.name}" has no fields placed.`,
        documentTypeId: docType.id,
        documentTypeName: docType.name,
      });
    }

    // Check rules column existence
    for (const rule of docType.rules || []) {
      if (!columnKeys.has(rule.columnKey)) {
        issues.push({
          id: `err_dt_${docType.id}_rule_col_missing`,
          severity: 'error',
          message: `Rule in "${docType.name}" refers to missing column "${rule.columnKey}".`,
          documentTypeId: docType.id,
          documentTypeName: docType.name,
        });
      }
    }

    // Check field mappings column existence
    for (const mapping of docType.fieldMappings || []) {
      if (mapping.source === 'participant_column' && mapping.columnKey) {
        if (!columnKeys.has(mapping.columnKey)) {
          issues.push({
            id: `err_dt_${docType.id}_map_col_${mapping.fieldKey}`,
            severity: 'error',
            message: `Field mapping "${mapping.fieldKey}" in "${docType.name}" refers to missing column "${mapping.columnKey}".`,
            documentTypeId: docType.id,
            documentTypeName: docType.name,
            fieldKey: mapping.fieldKey,
          });
        }
      }
    }

    // Calculate eligible participants for this docType
    let matchCount = 0;
    for (const p of activeParticipants) {
      if (isParticipantEligibleForDoc(docType, p)) {
        matchCount++;
      }
    }
    totalExpectedDocs += matchCount;

    if (matchCount === 0 && activeParticipants.length > 0) {
      issues.push({
        id: `warn_dt_${docType.id}_zero_matches`,
        severity: 'warning',
        message: `No active participants match the rules for "${docType.name}".`,
        documentTypeId: docType.id,
        documentTypeName: docType.name,
      });
    }
  }

  // 5. Participant Level Checks
  const seenCertIds = new Set<string>();

  for (const p of activeParticipants) {
    if (p.validationErrors && p.validationErrors.length > 0) {
      p.validationErrors.forEach((err, idx) => {
        issues.push({
          id: `warn_p_${p.id}_${idx}`,
          severity: 'warning',
          message: `Row ${p.rowNumber}: ${err}`,
          rowNumber: p.rowNumber,
          participantId: p.id,
          canExcludeRecord: true,
        });
      });
    }

    // Check if participant matches 0 enabled document types
    const matchedDocs = enabledDocTypes.filter(dt => isParticipantEligibleForDoc(dt, p));
    if (matchedDocs.length === 0 && enabledDocTypes.length > 0) {
      issues.push({
        id: `warn_p_${p.id}_no_matches`,
        severity: 'warning',
        message: `Row ${p.rowNumber} (${p.data.full_name || 'Unnamed'}) matches no document type rules.`,
        rowNumber: p.rowNumber,
        participantId: p.id,
        canExcludeRecord: true,
      });
    }

    // Check certificate ID duplicates if overridden
    if (p.certificateIdOverrides) {
      Object.entries(p.certificateIdOverrides).forEach(([_, customId]) => {
        if (seenCertIds.has(customId)) {
          issues.push({
            id: `err_dup_cert_id_${customId}`,
            severity: 'error',
            message: `Duplicate Certificate ID detected: "${customId}" on Row ${p.rowNumber}.`,
            rowNumber: p.rowNumber,
            participantId: p.id,
          });
        } else {
          seenCertIds.add(customId);
        }
      });
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return {
    issues,
    hasBlockingErrors: errorCount > 0,
    errorCount,
    warningCount,
    totalParticipants: allParticipants.length,
    eligibleCount: activeParticipants.length,
    excludedCount: allParticipants.length - activeParticipants.length,
    expectedDocumentsCount: totalExpectedDocs,
  };
}
