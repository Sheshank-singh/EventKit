import React, { useState, useRef, useEffect } from 'react';
import {
  EventProject,
  GeneratedDocument,
  GenerationReport,
  GenerationReportItem,
} from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  Download,
  FileCheck,
  FolderArchive,
  RefreshCw,
  XCircle,
  CheckCircle,
  Eye,
  FileText,
  AlertTriangle,
  FolderTree,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { isParticipantEligibleForDoc } from '../../lib/rule-engine';
import {
  generateCertificateId,
  buildDocumentFilename,
} from '../../lib/template-engine';
import { renderSingleDocument, createPdfBlobUrl } from '../../lib/pdf-renderer';
import {
  createBatchZip,
  buildCsvReport,
  triggerFileDownload,
  getCategorySubfolder,
} from '../../lib/zip-exporter';

export interface Step8Props {
  project: EventProject;
  onBack: () => void;
}

export const Step8GenerationAndExport: React.FC<Step8Props> = ({ project, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTaskLabel, setCurrentTaskLabel] = useState('');
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [report, setReport] = useState<GenerationReport | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const cancelFlagRef = useRef(false);

  // Start generation batch
  const startBulkGeneration = async () => {
    setIsGenerating(true);
    setIsCancelled(false);
    cancelFlagRef.current = false;
    setProgressPercent(0);
    setGeneratedDocs([]);
    setReport(null);

    const activeParticipants = project.participants.filter(p => !p.isExcluded);
    const enabledDocTypes = project.documentTypes.filter(d => d.isEnabled);

    // Build task queue of { participant, docType }
    const tasks: { participant: typeof activeParticipants[0]; docType: typeof enabledDocTypes[0] }[] = [];

    for (const dt of enabledDocTypes) {
      for (const p of activeParticipants) {
        if (isParticipantEligibleForDoc(dt, p)) {
          tasks.push({ participant: p, docType: dt });
        }
      }
    }

    const totalTasks = tasks.length;
    if (totalTasks === 0) {
      setIsGenerating(false);
      alert('No eligible documents to generate.');
      return;
    }

    const outputDocs: GeneratedDocument[] = [];
    const reportItems: GenerationReportItem[] = [];

    let successCount = 0;
    let failedCount = 0;
    let certCounter = 1;

    // Process in chunks to maintain UI responsiveness
    const CHUNK_SIZE = 3;

    for (let i = 0; i < totalTasks; i += CHUNK_SIZE) {
      if (cancelFlagRef.current) {
        setIsCancelled(true);
        break;
      }

      const chunk = tasks.slice(i, i + CHUNK_SIZE);

      await Promise.all(
        chunk.map(async ({ participant, docType }) => {
          if (cancelFlagRef.current) return;

          const certId =
            participant.certificateIdOverrides?.[docType.id] ||
            generateCertificateId(
              project.settings.certificateIdPrefix || 'CERT',
              certCounter++,
              project.settings.certificateIdPadding || 4
            );

          const participantName = participant.data.full_name || `Participant_${participant.rowNumber}`;
          const filename = buildDocumentFilename(
            project.settings.namingConvention || 'event_name_doc_id',
            project.metadata.name,
            participantName,
            docType.name,
            certId
          );

          const subfolder = getCategorySubfolder(docType.category);

          try {
            setCurrentTaskLabel(`Rendering ${docType.name} for ${participantName}...`);

            const pdfBytes = await renderSingleDocument({
              template: docType.template,
              mappings: docType.fieldMappings,
              participant,
              metadata: project.metadata,
              certificateId: certId,
            });

            outputDocs.push({
              id: `doc_${participant.id}_${docType.id}`,
              participantId: participant.id,
              participantName,
              documentTypeId: docType.id,
              documentTypeName: docType.name,
              documentCategory: docType.category,
              filename,
              subfolder,
              certificateId: certId,
              status: 'success',
              pdfBytes,
            });

            reportItems.push({
              rowNumber: participant.rowNumber,
              participantName,
              email: participant.data.email || '',
              documentType: docType.name,
              certificateId: certId,
              filename,
              status: 'SUCCESS',
            });

            successCount++;
          } catch (err: any) {
            console.error(`Generation error for ${participantName}:`, err);

            outputDocs.push({
              id: `doc_${participant.id}_${docType.id}`,
              participantId: participant.id,
              participantName,
              documentTypeId: docType.id,
              documentTypeName: docType.name,
              documentCategory: docType.category,
              filename,
              subfolder,
              certificateId: certId,
              status: 'failed',
              errorMessage: err?.message || 'Rendering error',
            });

            reportItems.push({
              rowNumber: participant.rowNumber,
              participantName,
              email: participant.data.email || '',
              documentType: docType.name,
              certificateId: certId,
              filename,
              status: 'FAILED',
              reason: err?.message || 'Unknown render failure',
            });

            failedCount++;
          }
        })
      );

      // Update progress
      const completed = Math.min(i + CHUNK_SIZE, totalTasks);
      setProgressPercent(Math.round((completed / totalTasks) * 100));

      // Yield execution to browser event loop
      await new Promise(resolve => setTimeout(resolve, 15));
    }

    // Add excluded records to the report for complete auditability
    project.participants
      .filter(p => p.isExcluded)
      .forEach(p => {
        reportItems.push({
          rowNumber: p.rowNumber,
          participantName: p.data.full_name || `Row_${p.rowNumber}`,
          email: p.data.email || '',
          documentType: 'ALL',
          certificateId: 'N/A',
          filename: 'N/A',
          status: 'EXCLUDED',
          reason: p.exclusionReason || 'Excluded by organizer',
        });
      });

    const finalReport: GenerationReport = {
      projectId: project.id,
      eventName: project.metadata.name,
      timestamp: new Date().toISOString(),
      totalParticipants: project.participants.length,
      totalEligible: activeParticipants.length,
      totalGenerated: successCount,
      totalFailed: failedCount,
      totalExcluded: project.participants.length - activeParticipants.length,
      totalSkipped: 0,
      items: reportItems,
    };

    setGeneratedDocs(outputDocs);
    setReport(finalReport);
    setIsGenerating(false);
    setCurrentTaskLabel('');
  };

  const handleCancel = () => {
    cancelFlagRef.current = true;
    setIsCancelled(true);
    setCurrentTaskLabel('Cancelling remaining tasks...');
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (!report || generatedDocs.length === 0) return;
    setIsZipping(true);
    try {
      const zipBlob = await createBatchZip({
        eventName: project.metadata.name,
        documents: generatedDocs,
        report,
        includeFolders: project.settings.zipBatchFolderStructure,
      });

      const zipFilename = `${project.metadata.name.replace(/\s+/g, '_')}_Documents.zip`;
      triggerFileDownload(zipBlob, zipFilename, 'application/zip');
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
      alert('Error creating ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  // Download CSV report
  const handleDownloadCsvReport = () => {
    if (!report) return;
    const csvContent = buildCsvReport(report);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${project.metadata.name.replace(/\s+/g, '_')}_Generation_Report.csv`;
    triggerFileDownload(blob, filename, 'text/csv');
  };

  // Download single PDF
  const handleDownloadSinglePdf = (doc: GeneratedDocument) => {
    if (!doc.pdfBytes) return;
    triggerFileDownload(doc.pdfBytes, doc.filename, 'application/pdf');
  };

  // Open Preview for single PDF
  const handlePreviewDoc = (doc: GeneratedDocument) => {
    if (!doc.pdfBytes) return;
    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    const url = createPdfBlobUrl(doc.pdfBytes);
    setPreviewPdfUrl(url);
    setSelectedPreviewDoc(doc);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bulk Generation & Export</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Render personalized PDFs in-browser with zero cloud latency, then download individually or in a structured ZIP.
          </p>
        </div>

        {!isGenerating && !report && (
          <Button
            size="lg"
            variant="primary"
            icon={<Sparkles className="w-5 h-5" />}
            onClick={startBulkGeneration}
          >
            Start Bulk Generation
          </Button>
        )}
      </div>

      {/* Progress & Live Generation State */}
      {isGenerating && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Generating Documents in Browser...
          </h3>

          <p className="text-xs text-slate-500 font-medium">{currentTaskLabel}</p>

          <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="bg-indigo-600 h-full rounded-full transition-all duration-200"
            />
          </div>

          <p className="text-xs font-bold text-slate-700">{progressPercent}% Completed</p>

          <div>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel Generation
            </Button>
          </div>
        </div>
      )}

      {/* Generation Finished Report */}
      {report && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Batch Generation Complete
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Successfully created <strong>{report.totalGenerated}</strong> documents. Failed: {report.totalFailed}. Excluded rows: {report.totalExcluded}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                icon={<FileText className="w-4 h-4 text-slate-600" />}
                onClick={handleDownloadCsvReport}
              >
                Download CSV Report
              </Button>

              <Button
                variant="primary"
                size="md"
                icon={<FolderArchive className="w-4 h-4" />}
                onClick={handleDownloadZip}
                loading={isZipping}
              >
                Download All in ZIP
              </Button>
            </div>
          </div>

          {/* Folder Hierarchy Preview */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 shadow-xs font-mono text-xs">
            <div className="flex items-center gap-2 mb-3 text-indigo-400 font-semibold font-sans">
              <FolderTree className="w-4 h-4" />
              <span>Export Folder Hierarchy Preview</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <p className="text-white font-bold">📦 {project.metadata.name}/</p>
              <p className="pl-4">├── 📁 Certificates/ ({generatedDocs.filter(d => d.subfolder === 'Certificates').length} files)</p>
              <p className="pl-4">├── 📁 Letters/ ({generatedDocs.filter(d => d.subfolder === 'Letters').length} files)</p>
              <p className="pl-4">├── 📁 ID-Cards/ ({generatedDocs.filter(d => d.subfolder === 'ID-Cards').length} files)</p>
              <p className="pl-4">└── 📁 reports/</p>
              <p className="pl-8">├── generation_report.csv</p>
              <p className="pl-8">└── manifest.json</p>
            </div>
          </div>

          {/* Generated Documents List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Output Documents ({generatedDocs.length} files)
              </h4>
              <Button size="sm" variant="ghost" onClick={startBulkGeneration} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                Regenerate Batch
              </Button>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {generatedDocs.map(doc => (
                <div
                  key={doc.id}
                  className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900 truncate">
                        {doc.participantName}
                      </span>
                      <Badge variant="indigo" size="sm">
                        {doc.documentTypeName}
                      </Badge>
                      <code className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                        {doc.certificateId}
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {doc.subfolder}/{doc.filename}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.status === 'success' ? (
                      <>
                        <button
                          onClick={() => handlePreviewDoc(doc)}
                          className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleDownloadSinglePdf(doc)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </>
                    ) : (
                      <Badge variant="rose" size="sm">
                        Failed: {doc.errorMessage}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Single PDF Preview Modal */}
      {selectedPreviewDoc && previewPdfUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedPreviewDoc.filename}
                </h3>
                <p className="text-xs text-slate-500">
                  Recipient: {selectedPreviewDoc.participantName} • ID: {selectedPreviewDoc.certificateId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleDownloadSinglePdf(selectedPreviewDoc)}
                >
                  Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedPreviewDoc(null);
                    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>

            <iframe
              src={previewPdfUrl}
              title="PDF preview"
              className="w-full h-[600px] rounded-xl border border-slate-200"
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back to Quality Checks
        </Button>
      </div>
    </div>
  );
};
