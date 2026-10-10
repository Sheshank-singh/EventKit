import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Participant, ParticipantColumn, MappedStandardColumn } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { parseSpreadsheetBuffer, createEmptyParticipant } from '../../lib/spreadsheet-parser';

export interface Step2Props {
  columns: ParticipantColumn[];
  participants: Participant[];
  onUpdateData: (columns: ParticipantColumn[], participants: Participant[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const STANDARD_COLUMN_OPTIONS: { value: MappedStandardColumn; label: string }[] = [
  { value: 'full_name', label: 'Full Name (Recipient)' },
  { value: 'email', label: 'Email Address' },
  { value: 'organization', label: 'Organization / College' },
  { value: 'role', label: 'Role (e.g. Participant, Judge)' },
  { value: 'category', label: 'Category / Track' },
  { value: 'award', label: 'Award / Prize Position' },
  { value: 'attendance', label: 'Attendance (Present/Absent)' },
  { value: 'certificate_id', label: 'Certificate / Reg ID' },
  { value: 'phone', label: 'Phone / Contact' },
  { value: 'custom', label: 'Custom Attribute' },
];

export const Step2DataImport: React.FC<Step2Props> = ({
  columns,
  participants,
  onUpdateData,
  onNext,
  onBack,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [cachedFileBuffer, setCachedFileBuffer] = useState<ArrayBuffer | null>(null);

  // Search, filter & editing states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid' | 'excluded'>('all');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessBuffer = (buffer: ArrayBuffer, sheetName?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = parseSpreadsheetBuffer(buffer, sheetName);
      setSheetNames(result.sheetNames);
      setSelectedSheet(result.selectedSheet);
      onUpdateData(result.columns, result.participants);

      setSuccessMessage(
        `Parsed ${result.totalRows} records from "${result.selectedSheet}". Valid: ${result.validRows}, Errors/Warnings: ${result.invalidRows}.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse file. Please verify it is a valid .xlsx or .csv.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMessage('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        setCachedFileBuffer(buffer);
        handleProcessBuffer(buffer);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Toggle record exclusion
  const handleToggleExclude = (participantId: string) => {
    const updated = participants.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          isExcluded: !p.isExcluded,
          exclusionReason: !p.isExcluded ? 'Manually excluded by user' : undefined,
        };
      }
      return p;
    });
    onUpdateData(columns, updated);
  };

  // Exclude all invalid records in 1 click
  const handleExcludeAllInvalid = () => {
    const updated = participants.map(p => {
      if (p.validationErrors && p.validationErrors.length > 0) {
        return {
          ...p,
          isExcluded: true,
          exclusionReason: `Auto-excluded due to: ${p.validationErrors.join(', ')}`,
        };
      }
      return p;
    });
    onUpdateData(columns, updated);
  };

  // Inline editing save
  const handleStartEdit = (p: Participant) => {
    setEditingRowId(p.id);
    setEditFormData({ ...p.data });
  };

  const handleSaveEdit = (p: Participant) => {
    const updated = participants.map(item => {
      if (item.id === p.id) {
        return {
          ...item,
          data: { ...editFormData },
          validationErrors: undefined, // Clear errors upon manual edit
        };
      }
      return item;
    });
    onUpdateData(columns, updated);
    setEditingRowId(null);
  };

  // Column mapping type change
  const handleColumnTypeChange = (colKey: string, newType: MappedStandardColumn) => {
    const updatedCols = columns.map(c => (c.key === colKey ? { ...c, mappedType: newType } : c));
    onUpdateData(updatedCols, participants);
  };

  // Summary counts
  const totalCount = participants.length;
  const excludedCount = participants.filter(p => p.isExcluded).length;
  const invalidCount = participants.filter(p => p.validationErrors && p.validationErrors.length > 0 && !p.isExcluded).length;
  const validCount = participants.filter(p => (!p.validationErrors || p.validationErrors.length === 0) && !p.isExcluded).length;

  // Filtered rows for table
  const filteredParticipants = participants.filter(p => {
    if (filterMode === 'excluded' && !p.isExcluded) return false;
    if (filterMode === 'valid' && (p.isExcluded || (p.validationErrors && p.validationErrors.length > 0))) return false;
    if (filterMode === 'invalid' && (p.isExcluded || !p.validationErrors || p.validationErrors.length === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return Object.values(p.data).some(val => String(val).toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
          <FileSpreadsheet className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          Upload Participant Spreadsheet
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
          Drag and drop your spreadsheet here, or browse files. Supports Excel (<code className="text-slate-700">.xlsx, .xls</code>) and CSV (<code className="text-slate-700">.csv</code>).
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            size="md"
            variant="primary"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            loading={isProcessing}
          >
            Browse Files
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
        </div>

        {sheetNames.length > 1 && cachedFileBuffer && (
          <div className="mt-5 inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">Select Sheet:</span>
            <select
              value={selectedSheet}
              onChange={e => handleProcessBuffer(cachedFileBuffer, e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-medium"
            >
              {sheetNames.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {errorMessage && (
        <Alert variant="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Dataset Summary & Actions */}
      {participants.length > 0 && (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[11px] font-semibold uppercase">Total Rows</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-emerald-700 text-[11px] font-semibold uppercase">Ready / Valid</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{validCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <span className="text-amber-700 text-[11px] font-semibold uppercase">Validation Warnings</span>
              <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{invalidCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-2xs">
              <span className="text-slate-500 text-[11px] font-semibold uppercase">Excluded Records</span>
              <p className="text-2xl font-extrabold text-slate-600 mt-0.5">{excludedCount}</p>
            </div>
          </div>

          {/* Column Classification Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Detected Columns & Mapping</h4>
                <p className="text-xs text-slate-500">
                  Verify or adjust the semantic meaning of each column for template variable binding.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {columns.map(col => (
                <div
                  key={col.key}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate" title={col.originalHeader}>
                      {col.originalHeader}
                    </span>
                    <code className="text-[10px] text-slate-500 bg-slate-200/60 px-1 py-0.5 rounded">
                      {'{{' + col.key + '}}'}
                    </code>
                  </div>
                  <select
                    value={col.mappedType}
                    onChange={e => handleColumnTypeChange(col.key, e.target.value as MappedStandardColumn)}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    {STANDARD_COLUMN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Table Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              {/* Search */}
              <div className="relative min-w-[240px] max-w-sm flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5">
                {(['all', 'valid', 'invalid', 'excluded'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      filterMode === mode
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {invalidCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExcludeAllInvalid}
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  Exclude All with Warnings
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 z-10 backdrop-blur">
                    <th className="py-2.5 px-3 w-16 text-center">Row</th>
                    <th className="py-2.5 px-3 w-24">Status</th>
                    {columns.map(col => (
                      <th key={col.key} className="py-2.5 px-3 min-w-[140px]">
                        {col.originalHeader}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.map(p => {
                    const isEditing = editingRowId === p.id;
                    const hasErrors = p.validationErrors && p.validationErrors.length > 0;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          p.isExcluded ? 'opacity-50 bg-slate-50' : hasErrors ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {p.rowNumber}
                        </td>

                        <td className="py-2 px-3">
                          {p.isExcluded ? (
                            <Badge variant="slate" size="sm">
                              Excluded
                            </Badge>
                          ) : hasErrors ? (
                            <Badge variant="amber" size="sm" title={p.validationErrors?.join('; ')}>
                              Warning
                            </Badge>
                          ) : (
                            <Badge variant="emerald" size="sm">
                              Valid
                            </Badge>
                          )}
                        </td>

                        {columns.map(col => (
                          <td key={col.key} className="py-2 px-3 text-slate-800">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editFormData[col.key] || ''}
                                onChange={e =>
                                  setEditFormData({ ...editFormData, [col.key]: e.target.value })
                                }
                                className="w-full px-2 py-1 text-xs border border-indigo-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              <span className="truncate block max-w-[200px]" title={p.data[col.key]}>
                                {p.data[col.key] || <em className="text-slate-300 font-sans">empty</em>}
                              </span>
                            )}
                          </td>
                        ))}

                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(p)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Save Changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingRowId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                  title="Cancel Edit"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(p)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                  title="Edit row"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleExclude(p.id)}
                                  className={`p-1 rounded ${
                                    p.isExcluded
                                      ? 'text-indigo-600 hover:bg-indigo-50'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                  }`}
                                  title={p.isExcluded ? 'Include record' : 'Exclude record'}
                                >
                                  {p.isExcluded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back to Event Details
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={participants.length === 0}
        >
          Continue to Document Types ({validCount} Valid Records)
        </Button>
      </div>
    </div>
  );
};
