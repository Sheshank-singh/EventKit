import React, { useState } from 'react';
import {
  DocumentType,
  Participant,
  ParticipantColumn,
  EventMetadata,
  FieldMapping,
  FieldMappingSource,
} from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { resolveFieldValue } from '../../lib/template-engine';
import { ArrowRight, Link2, Database, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export interface Step5Props {
  documentTypes: DocumentType[];
  columns: ParticipantColumn[];
  participants: Participant[];
  metadata: EventMetadata;
  onUpdateDocumentTypes: (docTypes: DocumentType[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step5FieldMapping: React.FC<Step5Props> = ({
  documentTypes,
  columns,
  participants,
  metadata,
  onUpdateDocumentTypes,
  onNext,
  onBack,
}) => {
  const [activeDocTypeId, setActiveDocTypeId] = useState<string>(
    documentTypes[0]?.id || ''
  );

  const activeDoc = documentTypes.find(d => d.id === activeDocTypeId) || documentTypes[0];
  const fields = (activeDoc?.template?.fields || []).filter(f => !f.isStatic && !f.isImage);
  const sampleParticipant = participants.find(p => !p.isExcluded) || participants[0];

  const handleUpdateMapping = (fieldId: string, updates: Partial<FieldMapping>) => {
    const existingMappings = [...(activeDoc.fieldMappings || [])];
    const mappingIdx = existingMappings.findIndex(m => m.fieldId === fieldId);

    const targetField = activeDoc.template.fields.find(f => f.id === fieldId);

    if (mappingIdx >= 0) {
      existingMappings[mappingIdx] = {
        ...existingMappings[mappingIdx],
        ...updates,
      };
    } else {
      existingMappings.push({
        fieldId,
        fieldKey: targetField?.key || fieldId,
        source: 'participant_column',
        ...updates,
      });
    }

    const updatedDocs = documentTypes.map(d =>
      d.id === activeDoc.id ? { ...d, fieldMappings: existingMappings } : d
    );
    onUpdateDocumentTypes(updatedDocs);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Field Mapping</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Map template variable tags to participant columns, event metadata, or auto-generated certificate IDs.
        </p>
      </div>

      {/* Doc type selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {documentTypes.map(dt => (
          <button
            key={dt.id}
            onClick={() => setActiveDocTypeId(dt.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeDocTypeId === dt.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {dt.name}
          </button>
        ))}
      </div>

      {/* Mapping Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {activeDoc.name} — Variable Mappings ({fields.length} dynamic fields)
          </span>
          <span className="text-xs text-slate-500">
            Previewing with record: <strong>{sampleParticipant?.data.full_name || 'Sample Row'}</strong>
          </span>
        </div>

        {fields.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            This document template has only static text fields. No variable mapping required.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {fields.map(field => {
              const mapping = activeDoc.fieldMappings?.find(
                m => m.fieldId === field.id || m.fieldKey === field.key
              );
              const source: FieldMappingSource = mapping?.source || 'participant_column';
              const previewValue = sampleParticipant
                ? resolveFieldValue(field, mapping, sampleParticipant, metadata, 'CERT-2026-0001')
                : '';

              return (
                <div
                  key={field.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Field Info */}
                  <div className="min-w-[180px]">
                    <h5 className="text-xs font-bold text-slate-900">{field.name}</h5>
                    <code className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {'{{' + field.key + '}}'}
                    </code>
                  </div>

                  {/* Mapping Source & Column Select */}
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    {/* Source Selector */}
                    <div className="w-44">
                      <select
                        value={source}
                        onChange={e =>
                          handleUpdateMapping(field.id, {
                            source: e.target.value as FieldMappingSource,
                          })
                        }
                        className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="participant_column">Participant Column</option>
                        <option value="event_metadata">Event Metadata</option>
                        <option value="computed_cert_id">Auto Certificate ID</option>
                        <option value="static">Fixed Custom Value</option>
                      </select>
                    </div>

                    {/* Dependent selector */}
                    {source === 'participant_column' && (
                      <div className="w-52">
                        <select
                          value={mapping?.columnKey || field.key}
                          onChange={e =>
                            handleUpdateMapping(field.id, {
                              source: 'participant_column',
                              columnKey: e.target.value,
                            })
                          }
                          className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-indigo-500"
                        >
                          {columns.map(col => (
                            <option key={col.key} value={col.key}>
                              {col.originalHeader} ({col.mappedType})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {source === 'event_metadata' && (
                      <div className="w-52">
                        <select
                          value={mapping?.metadataField || 'eventName'}
                          onChange={e =>
                            handleUpdateMapping(field.id, {
                              source: 'event_metadata',
                              metadataField: e.target.value as any,
                            })
                          }
                          className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="eventName">Event Name ({metadata.name})</option>
                          <option value="organizer">Organizer ({metadata.organizer})</option>
                          <option value="startDate">Start Date ({metadata.startDate})</option>
                          <option value="endDate">End Date ({metadata.endDate})</option>
                          <option value="location">Location ({metadata.location})</option>
                          <option value="eventType">Event Type ({metadata.eventType})</option>
                        </select>
                      </div>
                    )}

                    {source === 'static' && (
                      <div className="w-52">
                        <input
                          type="text"
                          placeholder="Fixed value..."
                          value={mapping?.staticValue || ''}
                          onChange={e =>
                            handleUpdateMapping(field.id, {
                              source: 'static',
                              staticValue: e.target.value,
                            })
                          }
                          className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                        />
                      </div>
                    )}

                    {source === 'computed_cert_id' && (
                      <span className="text-xs text-slate-500 italic">
                        Auto-generated unique format: prefix + padded index
                      </span>
                    )}
                  </div>

                  {/* Live Value Preview */}
                  <div className="min-w-[160px] max-w-[220px] text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Sample Result
                    </span>
                    <span
                      className="text-xs font-semibold text-slate-800 truncate block"
                      title={previewValue}
                    >
                      {previewValue || <em className="text-slate-300">empty</em>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back to Template Editor
        </Button>
        <Button variant="primary" onClick={onNext}>
          Proceed to Conditional Rules
        </Button>
      </div>
    </div>
  );
};
