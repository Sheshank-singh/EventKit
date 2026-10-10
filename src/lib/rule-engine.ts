import { GenerationRule, Participant, DocumentType } from '../types';

/**
 * Evaluates a single rule condition against a participant record.
 * Uses case-insensitive comparison for text matching.
 */
export function evaluateRuleCondition(rule: GenerationRule, participant: Participant): boolean {
  const rawValue = participant.data[rule.columnKey];
  const value = (rawValue !== undefined && rawValue !== null ? String(rawValue) : '').trim();
  const target = (rule.value || '').trim();

  const normValue = value.toLowerCase();
  const normTarget = target.toLowerCase();

  switch (rule.operator) {
    case 'equals':
      return normValue === normTarget;
    case 'not_equals':
      return normValue !== normTarget;
    case 'contains':
      return normValue.includes(normTarget);
    case 'is_not_empty':
      return value.length > 0;
    case 'is_empty':
      return value.length === 0;
    default:
      return true;
  }
}

/**
 * Evaluates whether a participant satisfies all rules for a document type (AND logic).
 * If no rules are defined, defaults to true (all participants are eligible).
 */
export function isParticipantEligibleForDoc(
  docType: DocumentType,
  participant: Participant
): boolean {
  if (participant.isExcluded) {
    return false;
  }

  if (!docType.isEnabled) {
    return false;
  }

  if (!docType.rules || docType.rules.length === 0) {
    return true; // No rules = all active participants match
  }

  // All rules must be satisfied (AND)
  return docType.rules.every(rule => evaluateRuleCondition(rule, participant));
}

/**
 * Returns list of eligible participants for a given document type.
 */
export function getEligibleParticipants(
  docType: DocumentType,
  participants: Participant[]
): Participant[] {
  return participants.filter(p => isParticipantEligibleForDoc(docType, p));
}

export interface RuleMatchAnalysis {
  docTypeMatches: Record<string, number>; // docTypeId -> count
  totalUniqueEligible: number;
  participantsWithNoDoc: Participant[];
  participantsWithMultipleDocs: { participant: Participant; docTypeIds: string[] }[];
}

/**
 * Analyzes rule coverage across all document types for all participants.
 */
export function analyzeRuleMatches(
  docTypes: DocumentType[],
  participants: Participant[]
): RuleMatchAnalysis {
  const docTypeMatches: Record<string, number> = {};
  docTypes.forEach(dt => {
    docTypeMatches[dt.id] = 0;
  });

  const participantMatches = new Map<string, string[]>(); // participantId -> docTypeIds
  const activeParticipants = participants.filter(p => !p.isExcluded);

  for (const p of activeParticipants) {
    participantMatches.set(p.id, []);
  }

  for (const dt of docTypes) {
    if (!dt.isEnabled) continue;
    for (const p of activeParticipants) {
      if (isParticipantEligibleForDoc(dt, p)) {
        docTypeMatches[dt.id] = (docTypeMatches[dt.id] || 0) + 1;
        participantMatches.get(p.id)?.push(dt.id);
      }
    }
  }

  const participantsWithNoDoc: Participant[] = [];
  const participantsWithMultipleDocs: { participant: Participant; docTypeIds: string[] }[] = [];

  activeParticipants.forEach(p => {
    const matches = participantMatches.get(p.id) || [];
    if (matches.length === 0) {
      participantsWithNoDoc.push(p);
    } else if (matches.length > 1) {
      participantsWithMultipleDocs.push({ participant: p, docTypeIds: matches });
    }
  });

  const totalUniqueEligible = activeParticipants.filter(p => {
    const m = participantMatches.get(p.id);
    return m && m.length > 0;
  }).length;

  return {
    docTypeMatches,
    totalUniqueEligible,
    participantsWithNoDoc,
    participantsWithMultipleDocs,
  };
}
