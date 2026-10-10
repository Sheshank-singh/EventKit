import React, { useState } from 'react';
import { DocumentTemplate } from '../../types';
import { getBuiltinTemplates } from '../../lib/builtin-templates';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { PlusCircle, Eye, LayoutTemplate, Layers, ArrowRight } from 'lucide-react';

export interface TemplatesGalleryProps {
  onStartEventWithTemplate: (template: DocumentTemplate) => void;
}

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({
  onStartEventWithTemplate,
}) => {
  const templates = getBuiltinTemplates();
  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState<DocumentTemplate | null>(
    null
  );

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Starter Template Library</h1>
        <p className="text-xs text-slate-500 mt-1">
          Hand-crafted vector starter designs for certificates, formal letters, and lanyard ID cards. 100% editable and customizable.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group"
          >
            {/* Visual Preview */}
            <div className="h-56 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4 border-b border-slate-100">
              {tpl.backgroundImageDataUrl && (
                <img
                  src={tpl.backgroundImageDataUrl}
                  alt={tpl.name}
                  className="max-h-full max-w-full object-contain rounded shadow-2xs group-hover:scale-105 transition-transform"
                />
              )}
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <span className="text-[10px] font-semibold bg-white/95 backdrop-blur px-2 py-0.5 rounded shadow-2xs border border-slate-200 text-slate-700">
                  {tpl.format} {tpl.orientation}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-base font-bold text-slate-900">{tpl.name}</h3>
                  <Badge variant="indigo" size="sm">
                    {tpl.fields.length} Fields
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Pre-configured with coordinates, standard fonts, and responsive text scaling.
                </p>

                {/* Field Tags */}
                <div className="flex flex-wrap gap-1 mb-5">
                  {tpl.fields.slice(0, 4).map(f => (
                    <span
                      key={f.id}
                      className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                    >
                      {f.name}
                    </span>
                  ))}
                  {tpl.fields.length > 4 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{tpl.fields.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setSelectedTemplateForModal(tpl)}
                  className="flex-1 text-xs"
                >
                  Preview Details
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  icon={<PlusCircle className="w-3.5 h-3.5" />}
                  onClick={() => onStartEventWithTemplate(tpl)}
                  className="flex-1 text-xs"
                >
                  Use Template
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplateForModal && (
        <Modal
          isOpen={Boolean(selectedTemplateForModal)}
          onClose={() => setSelectedTemplateForModal(null)}
          title={selectedTemplateForModal.name}
          subtitle={`${selectedTemplateForModal.format} (${selectedTemplateForModal.orientation}) • Vector Starter Template`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-center max-h-72 overflow-hidden">
              {selectedTemplateForModal.backgroundImageDataUrl && (
                <img
                  src={selectedTemplateForModal.backgroundImageDataUrl}
                  alt=""
                  className="max-h-64 object-contain shadow-sm rounded"
                />
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
                Included Overlay Fields:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedTemplateForModal.fields.map(f => (
                  <div
                    key={f.id}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{f.name}</span>
                      <code className="block text-[10px] font-mono text-indigo-600">
                        {'{{' + f.key + '}}'}
                      </code>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {f.fontSize}pt • {f.alignment}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedTemplateForModal(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => {
                  const tpl = selectedTemplateForModal;
                  setSelectedTemplateForModal(null);
                  onStartEventWithTemplate(tpl);
                }}
              >
                Create Event with this Template
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
