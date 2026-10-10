import React, { useState } from 'react';
import {
  EventProject,
  EventMetadata,
  Participant,
  ParticipantColumn,
  DocumentType,
} from '../../types';
import { Step1EventDetails } from './Step1EventDetails';
import { Step2DataImport } from './Step2DataImport';
import { Step3DocumentTypes } from './Step3DocumentTypes';
import { Step4TemplateEditor } from './Step4TemplateEditor';
import { Step5FieldMapping } from './Step5FieldMapping';
import { Step6RuleBuilder } from './Step6RuleBuilder';
import { Step7ValidationScreen } from './Step7ValidationScreen';
import { Step8GenerationAndExport } from './Step8GenerationAndExport';
import {
  Calendar,
  Users,
  Layers,
  Edit3,
  Link2,
  Filter,
  CheckCircle,
  Download,
} from 'lucide-react';

export interface WorkflowContainerProps {
  project: EventProject;
  onUpdateProject: (updated: EventProject) => void;
  onExitWorkflow: () => void;
}

const STEPS = [
  { id: 1, label: 'Event Details', icon: Calendar },
  { id: 2, label: 'Participant Data', icon: Users },
  { id: 3, label: 'Document Types', icon: Layers },
  { id: 4, label: 'Template Editor', icon: Edit3 },
  { id: 5, label: 'Field Mapping', icon: Link2 },
  { id: 6, label: 'Rules & Criteria', icon: Filter },
  { id: 7, label: 'Quality Audit', icon: CheckCircle },
  { id: 8, label: 'Batch Export', icon: Download },
];

export const WorkflowContainer: React.FC<WorkflowContainerProps> = ({
  project,
  onUpdateProject,
  onExitWorkflow,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDocTypeIdForEditor, setSelectedDocTypeIdForEditor] = useState<string | undefined>(
    undefined
  );

  const handleMetadataChange = (metadata: EventMetadata) => {
    onUpdateProject({ ...project, metadata });
  };

  const handleDataChange = (columns: ParticipantColumn[], participants: Participant[]) => {
    onUpdateProject({ ...project, columns, participants });
  };

  const handleDocumentTypesChange = (documentTypes: DocumentType[]) => {
    onUpdateProject({ ...project, documentTypes });
  };

  const handleSelectEditTemplate = (docTypeId: string) => {
    setSelectedDocTypeIdForEditor(docTypeId);
    setCurrentStep(4);
  };

  return (
    <div className="space-y-8 py-6">
      {/* Stepper Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs overflow-x-auto">
        <div className="flex items-center min-w-[760px] justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-xs font-semibold select-none ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isCompleted
                      ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-white text-indigo-600'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? '✓' : step.id}
                  </span>
                  <span className="whitespace-nowrap">{step.label}</span>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-indigo-300' : 'bg-slate-100'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Render */}
      <div>
        {currentStep === 1 && (
          <Step1EventDetails
            metadata={project.metadata}
            onChange={handleMetadataChange}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2DataImport
            columns={project.columns}
            participants={project.participants}
            onUpdateData={handleDataChange}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3DocumentTypes
            documentTypes={project.documentTypes}
            participants={project.participants}
            onUpdateDocumentTypes={handleDocumentTypesChange}
            onSelectEditTemplate={handleSelectEditTemplate}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4TemplateEditor
            documentTypes={project.documentTypes}
            participants={project.participants}
            metadata={project.metadata}
            selectedDocTypeId={selectedDocTypeIdForEditor}
            onUpdateDocumentTypes={handleDocumentTypesChange}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5FieldMapping
            documentTypes={project.documentTypes}
            columns={project.columns}
            participants={project.participants}
            metadata={project.metadata}
            onUpdateDocumentTypes={handleDocumentTypesChange}
            onNext={() => setCurrentStep(6)}
            onBack={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 6 && (
          <Step6RuleBuilder
            documentTypes={project.documentTypes}
            columns={project.columns}
            participants={project.participants}
            onUpdateDocumentTypes={handleDocumentTypesChange}
            onNext={() => setCurrentStep(7)}
            onBack={() => setCurrentStep(5)}
          />
        )}

        {currentStep === 7 && (
          <Step7ValidationScreen
            project={project}
            onUpdateParticipants={updated => onUpdateProject({ ...project, participants: updated })}
            onProceedToGenerate={() => setCurrentStep(8)}
            onBack={() => setCurrentStep(6)}
          />
        )}

        {currentStep === 8 && (
          <Step8GenerationAndExport
            project={project}
            onBack={() => setCurrentStep(7)}
          />
        )}
      </div>
    </div>
  );
};
