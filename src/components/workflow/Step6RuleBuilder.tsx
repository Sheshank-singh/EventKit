import React, { useState } from 'react';
import {
  DocumentType,
  Participant,
  ParticipantColumn,
  GenerationRule,
  RuleOperator,
} from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Plus, Trash2, CheckCircle, Users, Filter, Sparkles } from 'lucide-react';
import { getEligibleParticipants } from '../../lib/rule-engine';

export interface Step6Props {
  documentTypes: DocumentType[];
  columns: ParticipantColumn[];
  participants: Participant[];
  onUpdateDocumentTypes: (docTypes: DocumentType[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const OPERATOR_LABELS: { value: RuleOperator; label: string }[] = [
  { value: 'equals', label: 'Equals (case-insensitive)' },
  { value: 'not_equals', label: 'Does Not Equal' },
  { value: 'contains', label: 'Contains text' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
  { value: 'is_empty', label: 'Is Empty' },
];

export const Step6RuleBuilder: React.FC<Step6Props> = ({
  documentTypes,
  columns,
  participants,
  onUpdateDocumentTypes,
  onNext,
  onBack,
}) => {
  const [activeDocTypeId, setActiveDocTypeId] = useState<string>(
    documentTypes[0]?.id || ''
  );

  const activeDoc = documentTypes.find(d => d.id === activeDocTypeId) || documentTypes[0];
  const eligibleCount = getEligibleParticipants(activeDoc, participants).length;
  const activeParticipantsCount = participants.filter(p => !p.isExcluded).length;

  // Add rule condition
  const handleAddRule = () => {
    const newRule: GenerationRule = {
      id: `r_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      columnKey: columns[0]?.key || 'role',
      operator: 'equals',
      value: '',
    };
    const updatedDocs = documentTypes.map(d =>
      d.id === activeDoc.id ? { ...d, rules: [...(d.rules || []), newRule] } : d
    );
    onUpdateDocumentTypes(updatedDocs);
  };

  // Update rule condition
  const handleUpdateRule = (ruleId: string, updates: Partial<GenerationRule>) => {
    const updatedRules = (activeDoc.rules || []).map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    const updatedDocs = documentTypes.map(d =>
      d.id === activeDoc.id ? { ...d, rules: updatedRules } : d
    );
    onUpdateDocumentTypes(updatedDocs);
  };

  // Delete rule condition
  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = (activeDoc.rules || []).filter(r => r.id !== ruleId);
    const updatedDocs = documentTypes.map(d =>
      d.id === activeDoc.id ? { ...d, rules: updatedRules } : d
    );
    onUpdateDocumentTypes(updatedDocs);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Conditional Generation Rules</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Specify criteria determining which participants receive which documents. Multiple conditions for the same document are combined with <strong>AND</strong>.
        </p>
      </div>

      {/* Doc type selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {documentTypes.map(dt => {
          const matchCount = getEligibleParticipants(dt, participants).length;
          return (
            <button
              key={dt.id}
              onClick={() => setActiveDocTypeId(dt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeDocTypeId === dt.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{dt.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeDocTypeId === dt.id ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {matchCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rules Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Rules for: <span className="text-indigo-600">{activeDoc.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              If no rules are added, <strong>all active participants</strong> are eligible for this document.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live match pill */}
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>
                {eligibleCount} of {activeParticipantsCount} participants eligible
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddRule}
            >
              Add Condition
            </Button>
          </div>
        </div>

        {/* Rules list */}
        {activeDoc.rules.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            <Filter className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-slate-700">No Conditions Set (Universal)</p>
            <p className="text-[11px] mt-0.5">
              This document will be generated for every active participant in your spreadsheet ({activeParticipantsCount} records).
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDoc.rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center gap-3"
              >
                {idx > 0 && (
                  <span className="text-[11px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    AND
                  </span>
                )}
                {idx === 0 && (
                  <span className="text-[11px] font-bold text-slate-500 uppercase bg-slate-200/60 px-2 py-0.5 rounded">
                    WHERE
                  </span>
                )}

                {/* Column */}
                <div className="min-w-[160px] flex-1">
                  <select
                    value={rule.columnKey}
                    onChange={e => handleUpdateRule(rule.id, { columnKey: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium"
                  >
                    {columns.map(col => (
                      <option key={col.key} value={col.key}>
                        Column: {col.originalHeader}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div className="min-w-[160px] flex-1">
                  <select
                    value={rule.operator}
                    onChange={e =>
                      handleUpdateRule(rule.id, { operator: e.target.value as RuleOperator })
                    }
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium"
                  >
                    {OPERATOR_LABELS.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value Input (unless is_empty or is_not_empty) */}
                {rule.operator !== 'is_empty' && rule.operator !== 'is_not_empty' && (
                  <div className="min-w-[160px] flex-1">
                    <input
                      type="text"
                      placeholder="Target value (e.g. Present, First Place)..."
                      value={rule.value}
                      onChange={e => handleUpdateRule(rule.id, { value: e.target.value })}
                      className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
                  title="Remove condition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back to Field Mapping
        </Button>
        <Button variant="primary" onClick={onNext}>
          Run Pre-Generation Quality Checks
        </Button>
      </div>
    </div>
  );
};
