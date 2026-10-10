import React, { useRef, useState } from 'react';
import { EventProject } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  FolderOpen,
  Calendar,
  Clock,
  Trash2,
  Copy,
  Download,
  Upload,
  ArrowRight,
  HardDrive,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { triggerFileDownload } from '../../lib/zip-exporter';

export interface MyProjectsProps {
  projects: EventProject[];
  onOpenProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onImportProjectJson: (file: File) => void;
  onCreateNewProject: () => void;
}

export const MyProjects: React.FC<MyProjectsProps> = ({
  projects,
  onOpenProject,
  onDuplicateProject,
  onDeleteProject,
  onImportProjectJson,
  onCreateNewProject,
}) => {
  const [projectToDelete, setProjectToDelete] = useState<EventProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = (project: EventProject) => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const filename = `${project.metadata.name.replace(/\s+/g, '_')}_backup.json`;
    triggerFileDownload(blob, filename, 'application/json');
  };

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Local Projects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Projects stored safely on this device in your browser's IndexedDB. Zero cloud uploads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON Backup
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => e.target.files?.[0] && onImportProjectJson(e.target.files[0])}
            accept=".json"
            className="hidden"
          />

          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={onCreateNewProject}
          >
            Create New Event
          </Button>
        </div>
      </div>

      {/* Persistence Note Callout */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 text-xs text-amber-900">
        <HardDrive className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Local Storage Notice & Portability</p>
          <p className="text-amber-800 leading-relaxed">
            All your event configurations, participant data, and templates reside purely inside your local browser. If you clear your browser history/cache or switch to another computer, export your project as a <strong>JSON backup</strong> to keep a permanent archive.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Saved Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            You don't have any locally saved projects yet. Create an event or import a JSON backup.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={onCreateNewProject}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Create Your First Event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(proj => {
            const activeParticipants = proj.participants.filter(p => !p.isExcluded).length;
            const enabledDocs = proj.documentTypes.filter(d => d.isEnabled).length;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="indigo" size="sm">
                      {proj.metadata.eventType.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {proj.metadata.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                    {proj.metadata.organizer || 'Unnamed organizer'} • {proj.metadata.location || 'Local / Online'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl mb-4 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Participants</span>
                      <span className="font-semibold text-slate-800">
                        {activeParticipants} of {proj.participants.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Document Types</span>
                      <span className="font-semibold text-slate-800">
                        {enabledDocs} active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExportJson(proj)}
                      title="Export JSON Backup"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDuplicateProject(proj.id)}
                      title="Duplicate Project"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProjectToDelete(proj)}
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
                    Open
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Delete Project"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete <strong>"{projectToDelete?.metadata.name}"</strong> from your browser storage? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setProjectToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (projectToDelete) {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }
              }}
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
