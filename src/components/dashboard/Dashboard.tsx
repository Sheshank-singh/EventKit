import React from 'react';
import {
  PlusCircle,
  Play,
  Upload,
  Calendar,
  Users,
  Files,
  ArrowRight,
  Clock,
  Sparkles,
  FileCheck,
  Shield,
  Trash2,
  Copy,
  Download,
  AlertCircle,
} from 'lucide-react';
import { EventProject, DocumentTemplate } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getBuiltinTemplates } from '../../lib/builtin-templates';

export interface DashboardProps {
  recentProjects: EventProject[];
  onCreateNewEvent: () => void;
  onOpenProject: (projectId: string) => void;
  onLoadDemoMode: () => void;
  onImportProjectJson: (file: File) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onStartFromTemplate: (template: DocumentTemplate) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  recentProjects,
  onCreateNewEvent,
  onOpenProject,
  onLoadDemoMode,
  onImportProjectJson,
  onDeleteProject,
  onDuplicateProject,
  onStartFromTemplate,
}) => {
  const builtinTemplates = getBuiltinTemplates();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportProjectJson(file);
    }
  };

  return (
    <div className="space-y-10 py-6">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Zero Server Uploads • 100% Client-Side Privacy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Bulk Event Document Automation Platform
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Transform participant spreadsheets into personalized certificates, letters, ID cards, and attendance documents in seconds. One event, one dataset, multiple document types, reliable pre-generation quality checks, and one-click ZIP batch export.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              variant="primary"
              icon={<PlusCircle className="w-5 h-5" />}
              onClick={onCreateNewEvent}
              className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-900/50"
            >
              Create New Event
            </Button>

            <Button
              size="lg"
              variant="secondary"
              icon={<Play className="w-5 h-5 text-indigo-600 fill-indigo-600" />}
              onClick={onLoadDemoMode}
              className="bg-white hover:bg-slate-100 text-slate-900"
            >
              Explore Demo Mode (1-Click)
            </Button>

            <Button
              size="lg"
              variant="ghost"
              icon={<Upload className="w-4 h-4 text-slate-300" />}
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-300 hover:text-white hover:bg-white/10"
            >
              Import JSON Backup
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Ambient geometric background glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute right-48 bottom-0 -mb-12 w-64 h-64 rounded-full bg-purple-600/15 blur-2xl pointer-events-none" />
      </section>

      {/* 5-Step Workflow Explanation */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">How EventKit Works</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated end-to-end bulk generation in 5 deterministic steps
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            Guided Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              step: '1',
              title: 'Import Data',
              desc: 'Drag & drop Excel or CSV files with auto column mapping and instant validation.',
              icon: <Users className="w-5 h-5 text-indigo-600" />,
            },
            {
              step: '2',
              title: 'Add Templates',
              desc: 'Select built-in certificates or upload your existing PDF/image background designs.',
              icon: <Files className="w-5 h-5 text-indigo-600" />,
            },
            {
              step: '3',
              title: 'Map & Rules',
              desc: 'Overlay personalized fields and configure conditional generation rules (AND logic).',
              icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
            },
            {
              step: '4',
              title: 'Validate Batch',
              desc: 'Pre-flight checks detect missing values, duplicates, or overflow before generating.',
              icon: <FileCheck className="w-5 h-5 text-indigo-600" />,
            },
            {
              step: '5',
              title: 'Batch Export',
              desc: 'Generate thousands of PDFs locally in-browser and download as a structured ZIP.',
              icon: <Download className="w-5 h-5 text-indigo-600" />,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
                {item.icon}
              </div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Continue Local Projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Local Projects</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved in your browser's IndexedDB. No external servers or cloud storage used.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {recentProjects.length} {recentProjects.length === 1 ? 'project' : 'projects'} saved
          </span>
        </div>

        {recentProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No Local Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              You haven't created or saved any projects on this device yet. Start a new event or try demo mode.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="primary" onClick={onCreateNewEvent} icon={<PlusCircle className="w-4 h-4" />}>
                Create First Event
              </Button>
              <Button size="sm" variant="secondary" onClick={onLoadDemoMode} icon={<Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />}>
                Load Demo Project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map(proj => {
              const activeCount = proj.participants.filter(p => !p.isExcluded).length;
              return (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="indigo" size="sm">
                        {proj.metadata.eventType.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {proj.metadata.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                      {proj.metadata.organizer || 'Unnamed organizer'} • {proj.metadata.location || 'Local / Online'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-4 border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Participants</span>
                        <span className="font-semibold text-slate-800">
                          {activeCount} of {proj.participants.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Document Types</span>
                        <span className="font-semibold text-slate-800">
                          {proj.documentTypes.filter(d => d.isEnabled).length} active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDuplicateProject(proj.id)}
                        title="Duplicate Project"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        title="Delete Project"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => onOpenProject(proj.id)}
                    >
                      Open Project
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Start from Template Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Start from Template</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Professionally designed starter document templates ready to customize
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {builtinTemplates.slice(0, 4).map(tpl => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group"
            >
              {/* Template thumbnail preview */}
              <div className="h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center p-3 border-b border-slate-100">
                {tpl.backgroundImageDataUrl && (
                  <img
                    src={tpl.backgroundImageDataUrl}
                    alt={tpl.name}
                    className="max-h-full max-w-full object-contain rounded shadow-2xs group-hover:scale-105 transition-transform"
                  />
                )}
                <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-white/90 backdrop-blur px-2 py-0.5 rounded shadow-2xs border border-slate-200 text-slate-700">
                  {tpl.format} {tpl.orientation}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{tpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 mb-3">
                    {tpl.fields.length} pre-configured fields
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  icon={<PlusCircle className="w-3.5 h-3.5" />}
                  onClick={() => onStartFromTemplate(tpl)}
                  className="w-full text-xs"
                >
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
