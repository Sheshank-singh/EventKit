import React, { useState } from 'react';
import {
  PlusCircle,
  Copy,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  FileText,
  BadgeCheck,
  Mail,
  CreditCard,
  Layers,
  Settings2,
} from 'lucide-react';
import { DocumentType, DocumentCategory, DocumentTemplate, Participant } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { getBuiltinTemplates } from '../../lib/builtin-templates';
import { getEligibleParticipants } from '../../lib/rule-engine';

export interface Step3Props {
  documentTypes: DocumentType[];
  participants: Participant[];
  onUpdateDocumentTypes: (docTypes: DocumentType[]) => void;
  onSelectEditTemplate: (docTypeId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<DocumentCategory, React.ReactNode> = {
  certificate: <BadgeCheck className="w-4 h-4 text-indigo-600" />,
  letter: <Mail className="w-4 h-4 text-emerald-600" />,
  id_card: <CreditCard className="w-4 h-4 text-amber-600" />,
  attendance: <FileText className="w-4 h-4 text-sky-600" />,
  custom: <Layers className="w-4 h-4 text-purple-600" />,
};

export const Step3DocumentTypes: React.FC<Step3Props> = ({
  documentTypes,
  participants,
  onUpdateDocumentTypes,
  onSelectEditTemplate,
  onNext,
  onBack,
}) => {
  const builtinTemplates = getBuiltinTemplates();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentType | null>(null);

  // New Doc Type Form State
  const [newDocName, setNewDocName] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('certificate');
  const [selectedTemplateId, setSelectedTemplateId] = useState(builtinTemplates[0]?.id || '');

  const handleAddDocumentType = () => {
    if (!newDocName.trim()) return;

    const baseTemplate =
      builtinTemplates.find(t => t.id === selectedTemplateId) || builtinTemplates[0];

    const newDoc: DocumentType = {
      id: `dt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newDocName.trim(),
      category: newCategory,
      isEnabled: true,
      template: JSON.parse(JSON.stringify(baseTemplate)),
      rules: [],
      fieldMappings: [],
      outputSubfolder:
        newCategory === 'certificate'
          ? 'Certificates'
          : newCategory === 'letter'
          ? 'Letters'
          : newCategory === 'id_card'
          ? 'ID-Cards'
          : 'Documents',
    };

    onUpdateDocumentTypes([...documentTypes, newDoc]);
    setIsAddModalOpen(false);
    setNewDocName('');
  };

  const handleDuplicate = (dt: DocumentType) => {
    const copy: DocumentType = {
      ...JSON.parse(JSON.stringify(dt)),
      id: `dt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${dt.name} (Copy)`,
    };
    onUpdateDocumentTypes([...documentTypes, copy]);
  };

  const handleToggleEnable = (id: string) => {
    onUpdateDocumentTypes(
      documentTypes.map(d => (d.id === id ? { ...d, isEnabled: !d.isEnabled } : d))
    );
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= documentTypes.length) return;

    const reordered = [...documentTypes];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    onUpdateDocumentTypes(reordered);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      onUpdateDocumentTypes(documentTypes.filter(d => d.id !== docToDelete.id));
      setDocToDelete(null);
    }
  };

  const enabledCount = documentTypes.filter(d => d.isEnabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manage Document Types</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create certificates, letters, ID cards, and custom documents for different participant roles.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Document Type
        </Button>
      </div>

      {documentTypes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Document Types Added</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Add at least one document type (such as a Participation Certificate or ID Card) to personalize documents.
          </p>
          <Button
            size="sm"
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Create First Document Type
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documentTypes.map((dt, idx) => {
            const eligibleCount = getEligibleParticipants(dt, participants).length;
            const hasRules = dt.rules && dt.rules.length > 0;

            return (
              <div
                key={dt.id}
                className={`bg-white rounded-2xl border p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  dt.isEnabled
                    ? 'border-slate-200 hover:border-indigo-300 shadow-2xs'
                    : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5 text-slate-400 pt-0.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === documentTypes.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1 rounded-lg bg-slate-100">
                        {CATEGORY_ICONS[dt.category]}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{dt.name}</h4>
                      <Badge variant={dt.isEnabled ? 'indigo' : 'slate'} size="sm">
                        {dt.category}
                      </Badge>
                      {!dt.isEnabled && (
                        <Badge variant="rose" size="sm">
                          Disabled
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>
                        Template: <strong className="text-slate-700">{dt.template?.name || 'None'}</strong> (
                        {dt.template?.fields?.length || 0} fields)
                      </span>
                      <span>•</span>
                      <span>
                        Rules: <strong className="text-slate-700">{dt.rules.length} conditions</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Eligible Participants:{' '}
                        <strong className="text-indigo-600 font-bold">{eligibleCount}</strong> of{' '}
                        {participants.filter(p => !p.isExcluded).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Settings2 className="w-3.5 h-3.5" />}
                    onClick={() => onSelectEditTemplate(dt.id)}
                  >
                    Edit Template Canvas
                  </Button>

                  <button
                    onClick={() => handleDuplicate(dt)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Duplicate Document Type"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleEnable(dt.id)}
                    className={`p-2 rounded-lg transition-colors text-xs font-semibold ${
                      dt.isEnabled
                        ? 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                    title={dt.isEnabled ? 'Disable' : 'Enable'}
                  >
                    {dt.isEnabled ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    onClick={() => setDocToDelete(dt)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove Document Type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Type Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Document Type"
        subtitle="Create a new document variant with a chosen starter design"
        maxWidth="lg"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Document Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Winner Certificate / Mentor Letter"
              value={newDocName}
              onChange={e => setNewDocName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Category
            </label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as DocumentCategory)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="certificate">Certificate</option>
              <option value="letter">Appreciation / Formal Letter</option>
              <option value="id_card">Participant / Volunteer ID Card</option>
              <option value="attendance">Attendance Slip / Voucher</option>
              <option value="custom">Custom Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Starter Template Design
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
              {builtinTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedTemplateId === tpl.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-12 h-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                    {tpl.backgroundImageDataUrl && (
                      <img
                        src={tpl.backgroundImageDataUrl}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{tpl.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {tpl.format} {tpl.orientation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newDocName.trim()}
              onClick={handleAddDocumentType}
            >
              Create Document Type
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        title="Remove Document Type"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to remove <strong>"{docToDelete?.name}"</strong>? All template field positions and rule configurations for this document type will be deleted.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDocToDelete(null)}>
              Keep
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Delete Document Type
            </Button>
          </div>
        </div>
      </Modal>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back to Participant Data
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={enabledCount === 0}
        >
          Proceed to Template Editor ({enabledCount} Active Document Types)
        </Button>
      </div>
    </div>
  );
};
