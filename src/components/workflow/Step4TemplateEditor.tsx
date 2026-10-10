import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentType,
  TemplateField,
  Participant,
  EventMetadata,
  PAGE_SIZES,
  FontFamily,
  TextAlignment,
} from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  Plus,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Eye,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  FileCheck,
  Check,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { resolveFieldValue } from '../../lib/template-engine';
import { renderSingleDocument, createPdfBlobUrl } from '../../lib/pdf-renderer';

export interface Step4Props {
  documentTypes: DocumentType[];
  participants: Participant[];
  metadata: EventMetadata;
  selectedDocTypeId?: string;
  onUpdateDocumentTypes: (docTypes: DocumentType[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4TemplateEditor: React.FC<Step4Props> = ({
  documentTypes,
  participants,
  metadata,
  selectedDocTypeId,
  onUpdateDocumentTypes,
  onNext,
  onBack,
}) => {
  const [activeDocTypeId, setActiveDocTypeId] = useState<string>(
    selectedDocTypeId || documentTypes[0]?.id || ''
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [previewParticipantIndex, setPreviewParticipantIndex] = useState<number>(0);
  const [isRealPdfPreviewOpen, setIsRealPdfPreviewOpen] = useState<boolean>(false);
  const [realPdfUrl, setRealPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdfPreview, setIsGeneratingPdfPreview] = useState<boolean>(false);

  // Dragging & Resizing state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDraggingField, setIsDraggingField] = useState<boolean>(false);
  const [isResizingField, setIsResizingField] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialFieldBox, setInitialFieldBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });

  const bgUploadRef = useRef<HTMLInputElement>(null);
  const imageFieldUploadRef = useRef<HTMLInputElement>(null);

  const activeDoc = documentTypes.find(d => d.id === activeDocTypeId) || documentTypes[0];
  const template = activeDoc?.template;
  const fields = template?.fields || [];
  const selectedField = fields.find(f => f.id === selectedFieldId);

  // Active sample participant for live preview
  const sampleParticipant =
    participants.filter(p => !p.isExcluded)[previewParticipantIndex] ||
    participants[0] || {
      id: 'mock_preview',
      rowNumber: 1,
      data: {
        full_name: 'Alex Mercer',
        organization: 'Apex Institute of Technology',
        role: 'Participant',
        award: 'First Place',
        attendance: 'Present',
        track: 'AI & Robotics',
      },
      isExcluded: false,
    };

  // Sync active doc type if prop changes
  useEffect(() => {
    if (selectedDocTypeId) {
      setActiveDocTypeId(selectedDocTypeId);
    }
  }, [selectedDocTypeId]);

  // Update a single field in the active document template
  const handleUpdateField = (fieldId: string, updates: Partial<TemplateField>) => {
    if (!template) return;
    const updatedFields = fields.map(f => (f.id === fieldId ? { ...f, ...updates } : f));
    const updatedTemplate = { ...template, fields: updatedFields };
    const updatedDocs = documentTypes.map(d =>
      d.id === activeDoc.id ? { ...d, template: updatedTemplate } : d
    );
    onUpdateDocumentTypes(updatedDocs);
  };

  // Add a new text field to current template
  const handleAddField = () => {
    if (!template) return;
    const newField: TemplateField = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      key: 'custom_text',
      name: 'Custom Field',
      x: 0.25,
      y: 0.35,
      width: 0.5,
      height: 0.08,
      fontSize: 16,
      minFontSize: 10,
      fontFamily: 'Helvetica',
      color: '#1e293b',
      alignment: 'center',
      isBold: false,
      wrapText: false,
    };

    const updatedTemplate = { ...template, fields: [...fields, newField] };
    const updatedDocs = documentTypes.map(d =>
      d.id === activeDoc.id ? { ...d, template: updatedTemplate } : d
    );
    onUpdateDocumentTypes(updatedDocs);
    setSelectedFieldId(newField.id);
  };

  // Delete a field
  const handleDeleteField = (fieldId: string) => {
    if (!template) return;
    const updatedFields = fields.filter(f => f.id !== fieldId);
    const updatedTemplate = { ...template, fields: updatedFields };
    const updatedDocs = documentTypes.map(d =>
      d.id === activeDoc.id ? { ...d, template: updatedTemplate } : d
    );
    onUpdateDocumentTypes(updatedDocs);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  // Duplicate a field
  const handleDuplicateField = (field: TemplateField) => {
    if (!template) return;
    const copy: TemplateField = {
      ...JSON.parse(JSON.stringify(field)),
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${field.name} (Copy)`,
      x: Math.min(field.x + 0.04, 0.8),
      y: Math.min(field.y + 0.04, 0.8),
    };
    const updatedTemplate = { ...template, fields: [...fields, copy] };
    const updatedDocs = documentTypes.map(d =>
      d.id === activeDoc.id ? { ...d, template: updatedTemplate } : d
    );
    onUpdateDocumentTypes(updatedDocs);
    setSelectedFieldId(copy.id);
  };

  // Handle custom background image or PDF upload
  const handleBgUpload = (file: File) => {
    if (!template) return;

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const updatedTemplate = {
          ...template,
          type: 'custom_pdf' as const,
          pdfBytesBase64: dataUrl,
          backgroundImageDataUrl: undefined,
        };
        const updatedDocs = documentTypes.map(d =>
          d.id === activeDoc.id ? { ...d, template: updatedTemplate } : d
        );
        onUpdateDocumentTypes(updatedDocs);
      };
      reader.readAsDataURL(file);
    } else {
      // Image upload (PNG, JPG)
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const updatedTemplate = {
          ...template,
          type: 'custom_image' as const,
          backgroundImageDataUrl: dataUrl,
          pdfBytesBase64: undefined,
        };
        const updatedDocs = documentTypes.map(d =>
          d.id === activeDoc.id ? { ...d, template: updatedTemplate } : d
        );
        onUpdateDocumentTypes(updatedDocs);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding an embedded logo or signature image field
  const handleAddImageField = (file: File) => {
    if (!template) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newImgField: TemplateField = {
        id: `img_${Date.now()}`,
        key: 'signature_logo',
        name: 'Signature / Logo',
        x: 0.15,
        y: 0.75,
        width: 0.2,
        height: 0.1,
        fontSize: 12,
        fontFamily: 'Helvetica',
        color: '#000000',
        alignment: 'center',
        isImage: true,
        imageDataUrl: dataUrl,
      };
      const updatedTemplate = { ...template, fields: [...fields, newImgField] };
      const updatedDocs = documentTypes.map(d =>
        d.id === activeDoc.id ? { ...d, template: updatedTemplate } : d
      );
      onUpdateDocumentTypes(updatedDocs);
      setSelectedFieldId(newImgField.id);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Resize handlers on the normalized canvas
  const handleFieldMouseDown = (e: React.MouseEvent, field: TemplateField) => {
    e.stopPropagation();
    setSelectedFieldId(field.id);
    setIsDraggingField(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setInitialFieldBox({ x: field.x, y: field.y, w: field.width, h: field.height });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, field: TemplateField) => {
    e.stopPropagation();
    setSelectedFieldId(field.id);
    setIsResizingField(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setInitialFieldBox({ x: field.x, y: field.y, w: field.width, h: field.height });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !selectedField) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    const deltaX = (e.clientX - dragStartPos.x) / canvasWidth;
    const deltaY = (e.clientY - dragStartPos.y) / canvasHeight;

    if (isDraggingField) {
      let newX = Math.max(0, Math.min(1 - initialFieldBox.w, initialFieldBox.x + deltaX));
      let newY = Math.max(0, Math.min(1 - initialFieldBox.h, initialFieldBox.y + deltaY));
      handleUpdateField(selectedField.id, {
        x: Number(newX.toFixed(4)),
        y: Number(newY.toFixed(4)),
      });
    } else if (isResizingField) {
      let newW = Math.max(0.04, Math.min(1 - initialFieldBox.x, initialFieldBox.w + deltaX));
      let newH = Math.max(0.02, Math.min(1 - initialFieldBox.y, initialFieldBox.h + deltaY));
      handleUpdateField(selectedField.id, {
        width: Number(newW.toFixed(4)),
        height: Number(newH.toFixed(4)),
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingField(false);
    setIsResizingField(false);
  };

  // Generate real PDF preview on the fly using pdf-lib!
  const handleGeneratePdfPreview = async () => {
    if (!template) return;
    setIsGeneratingPdfPreview(true);
    try {
      const pdfBytes = await renderSingleDocument({
        template,
        mappings: activeDoc.fieldMappings || [],
        participant: sampleParticipant,
        metadata,
        certificateId: 'SAMPLE-PREVIEW-001',
      });
      const url = createPdfBlobUrl(pdfBytes);
      setRealPdfUrl(url);
      setIsRealPdfPreviewOpen(true);
    } catch (err) {
      console.error('Failed to render PDF preview:', err);
      alert('PDF generation preview failed. Check console for details.');
    } finally {
      setIsGeneratingPdfPreview(false);
    }
  };

  // Canvas aspect ratio calculations based on format & orientation
  const pageDim =
    PAGE_SIZES[template?.format || 'A4']?.[template?.orientation || 'landscape'] ||
    PAGE_SIZES.A4.landscape;

  const aspectRatio = pageDim.widthPt / pageDim.heightPt;

  return (
    <div className="space-y-4">
      {/* Top Document Type Tabs & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Document Type Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {documentTypes.map(dt => (
            <button
              key={dt.id}
              onClick={() => {
                setActiveDocTypeId(dt.id);
                setSelectedFieldId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeDocTypeId === dt.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {dt.name}
            </button>
          ))}
        </div>

        {/* Toolbar actions */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors text-[10px] font-semibold"
              title="Reset Zoom"
            >
              Fit
            </button>
          </div>

          {/* Add Field */}
          <Button
            size="sm"
            variant="outline"
            icon={<Type className="w-3.5 h-3.5" />}
            onClick={handleAddField}
          >
            Add Text Field
          </Button>

          {/* Upload Image / Logo */}
          <Button
            size="sm"
            variant="outline"
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            onClick={() => imageFieldUploadRef.current?.click()}
          >
            Add Logo/Signature
          </Button>
          <input
            type="file"
            ref={imageFieldUploadRef}
            onChange={e => e.target.files?.[0] && handleAddImageField(e.target.files[0])}
            accept="image/png,image/jpeg"
            className="hidden"
          />

          {/* Upload Background */}
          <Button
            size="sm"
            variant="outline"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => bgUploadRef.current?.click()}
          >
            Replace Background
          </Button>
          <input
            type="file"
            ref={bgUploadRef}
            onChange={e => e.target.files?.[0] && handleBgUpload(e.target.files[0])}
            accept=".png,.jpg,.jpeg,.pdf"
            className="hidden"
          />

          {/* Real PDF Preview */}
          <Button
            size="sm"
            variant="primary"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={handleGeneratePdfPreview}
            loading={isGeneratingPdfPreview}
          >
            Preview PDF
          </Button>
        </div>
      </div>

      {/* Main Workspace: Canvas on Left/Center, Properties on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Canvas Area */}
        <div className="lg:col-span-3 bg-slate-900/5 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[560px] overflow-auto relative">
          {/* Sample Participant Selector Bar */}
          <div className="w-full max-w-xl mb-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Sample Preview Record:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {sampleParticipant.data.full_name || 'Unnamed Participant'}
              </span>
              <span className="text-slate-400">({sampleParticipant.data.role || 'Participant'})</span>
              {participants.length > 1 && (
                <button
                  onClick={() =>
                    setPreviewParticipantIndex(prev => (prev + 1) % participants.length)
                  }
                  className="text-indigo-600 hover:text-indigo-800 font-semibold underline text-[11px] ml-1"
                >
                  Next Participant
                </button>
              )}
            </div>
          </div>

          {/* The Document Canvas */}
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: isDraggingField || isResizingField ? 'none' : 'transform 0.15s ease',
            }}
            className="relative shadow-2xl rounded-sm select-none"
          >
            <div
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onClick={() => setSelectedFieldId(null)}
              style={{
                width: aspectRatio > 1 ? '780px' : '520px',
                height: aspectRatio > 1 ? `${780 / aspectRatio}px` : `${520 / aspectRatio}px`,
              }}
              className="relative bg-white border border-slate-300 overflow-hidden cursor-crosshair"
            >
              {/* Background Visual */}
              {template?.backgroundImageDataUrl ? (
                <img
                  src={template.backgroundImageDataUrl}
                  alt="Template background"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-mono">
                  Vector Blank Canvas ({template?.format} {template?.orientation})
                </div>
              )}

              {/* Editable Fields Overlay */}
              {fields.map(field => {
                const isSelected = field.id === selectedFieldId;
                const mapping = activeDoc.fieldMappings?.find(
                  m => m.fieldId === field.id || m.fieldKey === field.key
                );
                const displayValue = resolveFieldValue(
                  field,
                  mapping,
                  sampleParticipant,
                  metadata,
                  'CERT-0001'
                );

                return (
                  <div
                    key={field.id}
                    onMouseDown={e => handleFieldMouseDown(e, field)}
                    style={{
                      left: `${field.x * 100}%`,
                      top: `${field.y * 100}%`,
                      width: `${field.width * 100}%`,
                      height: `${field.height * 100}%`,
                      color: field.color,
                      fontSize: `${field.fontSize * (aspectRatio > 1 ? 0.95 : 0.85)}px`,
                      textAlign: field.alignment,
                      fontWeight:
                        field.isBold || field.fontFamily.includes('Bold') ? 'bold' : 'normal',
                      fontFamily: field.fontFamily.includes('Times')
                        ? 'Times New Roman, serif'
                        : field.fontFamily.includes('Courier')
                        ? 'Courier New, monospace'
                        : 'Inter, sans-serif',
                    }}
                    className={`absolute flex items-center px-1 rounded transition-shadow cursor-move ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 bg-indigo-50/30 z-20 shadow-md'
                        : 'hover:ring-1 hover:ring-indigo-300/80 hover:bg-indigo-50/10 z-10'
                    }`}
                  >
                    {/* Field Content */}
                    {field.isImage && field.imageDataUrl ? (
                      <img
                        src={field.imageDataUrl}
                        alt="Logo/Signature"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <span
                        className={`w-full leading-tight select-none pointer-events-none ${
                          field.wrapText ? 'whitespace-normal' : 'truncate'
                        }`}
                      >
                        {displayValue || (
                          <span className="text-slate-400 italic text-xs">
                            {'{' + field.name + '}'}
                          </span>
                        )}
                      </span>
                    )}

                    {/* Resize Handle on bottom-right corner when selected */}
                    {isSelected && (
                      <div
                        onMouseDown={e => handleResizeMouseDown(e, field)}
                        className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-600 border border-white rounded-tl cursor-se-resize shadow-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Field Properties Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">Field Properties</h4>
            {selectedField && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDuplicateField(selectedField)}
                  title="Duplicate field"
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteField(selectedField.id)}
                  title="Delete field"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {selectedField ? (
            <div className="space-y-4 text-xs">
              {/* Field Label */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Field Label
                </label>
                <input
                  type="text"
                  value={selectedField.name}
                  onChange={e => handleUpdateField(selectedField.id, { name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Key identifier */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Variable Key
                </label>
                <input
                  type="text"
                  value={selectedField.key}
                  onChange={e => handleUpdateField(selectedField.id, { key: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-indigo-700 bg-indigo-50/30"
                />
              </div>

              {/* Static text toggle */}
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedField.isStatic)}
                    onChange={e =>
                      handleUpdateField(selectedField.id, {
                        isStatic: e.target.checked,
                        staticText: e.target.checked ? selectedField.staticText || selectedField.name : undefined,
                      })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span>Fixed / Static Text</span>
                </label>

                {selectedField.isStatic && (
                  <textarea
                    rows={2}
                    value={selectedField.staticText || ''}
                    onChange={e =>
                      handleUpdateField(selectedField.id, { staticText: e.target.value })
                    }
                    placeholder="Enter fixed text..."
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* Typography */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Font Family
                  </label>
                  <select
                    value={selectedField.fontFamily}
                    onChange={e =>
                      handleUpdateField(selectedField.id, {
                        fontFamily: e.target.value as FontFamily,
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Helvetica">Helvetica</option>
                    <option value="Helvetica-Bold">Helvetica Bold</option>
                    <option value="Times-Roman">Times Roman</option>
                    <option value="Times-Bold">Times Bold</option>
                    <option value="Courier">Courier</option>
                    <option value="Courier-Bold">Courier Bold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Font Size ({selectedField.fontSize}pt)
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={72}
                    value={selectedField.fontSize}
                    onChange={e =>
                      handleUpdateField(selectedField.id, {
                        fontSize: Math.max(6, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Alignment & Color */}
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Alignment
                  </label>
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => handleUpdateField(selectedField.id, { alignment: align })}
                        className={`flex-1 py-1.5 flex items-center justify-center transition-colors ${
                          selectedField.alignment === align
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg p-1 bg-white">
                    <input
                      type="color"
                      value={selectedField.color}
                      onChange={e =>
                        handleUpdateField(selectedField.id, { color: e.target.value })
                      }
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={selectedField.color}
                      onChange={e =>
                        handleUpdateField(selectedField.id, { color: e.target.value })
                      }
                      className="w-full text-xs font-mono uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Text Wrapping */}
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(selectedField.wrapText)}
                  onChange={e =>
                    handleUpdateField(selectedField.id, { wrapText: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Enable Multi-Line Text Wrapping</span>
              </label>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-xs">No Field Selected</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Click any bounding box on the template canvas to edit font, color, or mapping.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real PDF Preview Modal */}
      <Modal
        isOpen={isRealPdfPreviewOpen}
        onClose={() => {
          setIsRealPdfPreviewOpen(false);
          if (realPdfUrl) URL.revokeObjectURL(realPdfUrl);
          setRealPdfUrl(null);
        }}
        title={`Rendered PDF Preview: ${activeDoc.name}`}
        subtitle="Generated client-side via pdf-lib with exact vector coordinates and typography"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {realPdfUrl && (
            <iframe
              src={realPdfUrl}
              title="PDF Preview"
              className="w-full h-[600px] rounded-xl border border-slate-200"
            />
          )}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsRealPdfPreviewOpen(false);
                if (realPdfUrl) URL.revokeObjectURL(realPdfUrl);
                setRealPdfUrl(null);
              }}
            >
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back to Document Types
        </Button>
        <Button variant="primary" onClick={onNext}>
          Proceed to Field Mapping & Rules
        </Button>
      </div>
    </div>
  );
};
