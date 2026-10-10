import React from 'react';
import {
  EventProject,
  ValidationIssue,
  Participant,
} from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  EyeOff,
  CheckCircle,
  ArrowRight,
  FileCheck,
  Users,
  Files,
  Download,
} from 'lucide-react';
import { validateEventProject } from '../../lib/validation-engine';

export interface Step7Props {
  project: EventProject;
  onUpdateParticipants: (participants: Participant[]) => void;
  onProceedToGenerate: () => void;
  onBack: () => void;
}

export const Step7ValidationScreen: React.FC<Step7Props> = ({
  project,
  onUpdateParticipants,
  onProceedToGenerate,
  onBack,
}) => {
  const summary = validateEventProject(project);

  const handleExcludeRecord = (participantId: string) => {
    const updated = project.participants.map(p =>
      p.id === participantId
        ? { ...p, isExcluded: true, exclusionReason: 'Excluded during validation check' }
        : p
    );
    onUpdateParticipants(updated);
  };

  const handleAutoExcludeAllProblematic = () => {
    const problematicIds = new Set(
      summary.issues
        .filter(i => i.participantId && i.canExcludeRecord)
        .map(i => i.participantId!)
    );

    const updated = project.participants.map(p =>
      problematicIds.has(p.id)
        ? { ...p, isExcluded: true, exclusionReason: 'Auto-excluded due to validation flags' }
        : p
    );
    onUpdateParticipants(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Pre-Generation Quality Checks</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive automated audit to prevent broken PDFs, missing variables, or corrupt filenames before batch generation.
        </p>
      </div>

      {/* Audit Banner */}
      {summary.hasBlockingErrors ? (
        <Alert
          variant="error"
          title="Blocking Errors Detected"
        >
          There are {summary.errorCount} critical issues that must be addressed before document generation can proceed. Review and fix them below.
        </Alert>
      ) : summary.warningCount > 0 ? (
        <Alert
          variant="warning"
          title="Validation Warnings Found"
        >
          {summary.warningCount} non-blocking warnings found. You can exclude affected records or proceed with batch generation.
        </Alert>
      ) : (
        <Alert
          variant="success"
          title="All Checks Passed!"
        >
          Zero blocking errors or warnings detected. Your batch is 100% ready for bulk generation!
        </Alert>
      )}

      {/* Batch Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            Eligible Recipients
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.eligibleCount}
          </p>
          <span className="text-[10px] text-slate-400">
            {summary.excludedCount} excluded
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase flex items-center gap-1.5">
            <Files className="w-3.5 h-3.5 text-indigo-600" />
            Active Doc Types
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {project.documentTypes.filter(d => d.isEnabled).length}
          </p>
          <span className="text-[10px] text-slate-400">Selected for export</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <span className="text-indigo-700 text-[11px] font-semibold uppercase flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            Total Output Files
          </span>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">
            {summary.expectedDocumentsCount}
          </p>
          <span className="text-[10px] text-indigo-500">PDFs to be generated</span>
        </div>

        <div
          className={`bg-white p-4 rounded-xl border shadow-2xs ${
            summary.hasBlockingErrors ? 'border-rose-200 bg-rose-50/20' : 'border-emerald-200 bg-emerald-50/20'
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase flex items-center gap-1.5 ${
              summary.hasBlockingErrors ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {summary.hasBlockingErrors ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            )}
            Batch Status
          </span>
          <p
            className={`text-base font-extrabold mt-1 ${
              summary.hasBlockingErrors ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {summary.hasBlockingErrors ? 'Action Required' : 'Ready to Generate'}
          </p>
          <span className="text-[10px] text-slate-400">
            {summary.errorCount} errors, {summary.warningCount} warnings
          </span>
        </div>
      </div>

      {/* Validation Issue List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            Audit Checklist ({summary.issues.length} items)
          </h4>
          {summary.warningCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoExcludeAllProblematic}
              className="text-xs"
            >
              Exclude All Flagged Records
            </Button>
          )}
        </div>

        {summary.issues.length === 0 ? (
          <div className="p-10 text-center text-emerald-700 space-y-2">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="font-bold text-sm">Perfect Batch Score!</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No missing fields, duplicates, or rule collisions detected across any participant rows or document templates.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {summary.issues.map(issue => (
              <div
                key={issue.id}
                className={`p-4 flex items-start justify-between gap-3 ${
                  issue.severity === 'error' ? 'bg-rose-50/20' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {issue.severity === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={issue.severity === 'error' ? 'rose' : 'amber'}
                        size="sm"
                      >
                        {issue.severity === 'error' ? 'Blocking Error' : 'Warning'}
                      </Badge>
                      <h5 className="text-xs font-bold text-slate-900">{issue.message}</h5>
                    </div>

                    {issue.detail && (
                      <p className="text-xs text-slate-500 mt-1">{issue.detail}</p>
                    )}
                  </div>
                </div>

                {issue.participantId && issue.canExcludeRecord && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<EyeOff className="w-3.5 h-3.5" />}
                    onClick={() => handleExcludeRecord(issue.participantId!)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex-shrink-0"
                  >
                    Exclude Row
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back to Rules
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onProceedToGenerate}
          disabled={summary.hasBlockingErrors || summary.expectedDocumentsCount === 0}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {summary.hasBlockingErrors
            ? 'Resolve Blocking Errors to Continue'
            : `Generate ${summary.expectedDocumentsCount} Documents`}
        </Button>
      </div>
    </div>
  );
};
