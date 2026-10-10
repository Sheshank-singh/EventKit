import React, { useState, useEffect } from 'react';
import { EventProject, DocumentTemplate } from './types';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkflowContainer } from './components/workflow/WorkflowContainer';
import { MyProjects } from './components/projects/MyProjects';
import { TemplatesGallery } from './components/templates/TemplatesGallery';
import { HelpGuide } from './components/guide/HelpGuide';
import {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  duplicateProject,
  validateAndParseProjectJson,
} from './lib/project-storage';
import { createSampleEventProject } from './lib/sample-data';
import { getBuiltinTemplates } from './lib/builtin-templates';

type AppTab = 'dashboard' | 'workflow' | 'projects' | 'templates' | 'guide';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [recentProjects, setRecentProjects] = useState<EventProject[]>([]);
  const [activeProject, setActiveProject] = useState<EventProject | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Load saved projects on initial mount
  useEffect(() => {
    refreshProjectList();
  }, []);

  const refreshProjectList = async () => {
    try {
      const projects = await listProjects();
      setRecentProjects(projects);
    } catch (err) {
      console.warn('Failed to load local projects:', err);
    }
  };

  // Helper to create a new empty event project
  const createNewEmptyProject = (starterTemplate?: DocumentTemplate): EventProject => {
    const builtinTemplates = getBuiltinTemplates();
    const primaryTemplate = starterTemplate || builtinTemplates[0];

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: newId,
      metadata: {
        name: 'New Event',
        organizer: '',
        eventType: 'workshop',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        location: '',
        isOnline: false,
        description: '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: [],
      participants: [],
      documentTypes: [
        {
          id: `dt_default_${Date.now()}`,
          name: primaryTemplate.name.replace(/\(.*\)/, '').trim(),
          category: primaryTemplate.builtinTemplateId?.includes('letter')
            ? 'letter'
            : primaryTemplate.builtinTemplateId?.includes('id')
            ? 'id_card'
            : 'certificate',
          isEnabled: true,
          template: JSON.parse(JSON.stringify(primaryTemplate)),
          rules: [],
          fieldMappings: [],
          outputSubfolder: 'Certificates',
        },
      ],
      settings: {
        certificateIdPrefix: 'CERT',
        certificateIdPadding: 4,
        namingConvention: 'event_name_doc_id',
        zipBatchFolderStructure: true,
      },
    };
  };

  // Actions
  const handleCreateNewEvent = () => {
    const newProj = createNewEmptyProject();
    setActiveProject(newProj);
    setHasUnsavedChanges(true);
    setCurrentTab('workflow');
  };

  const handleLoadDemoMode = () => {
    const demoProj = createSampleEventProject();
    setActiveProject(demoProj);
    setHasUnsavedChanges(true);
    setCurrentTab('workflow');
  };

  const handleOpenProject = async (projectId: string) => {
    try {
      const proj = await loadProject(projectId);
      if (proj) {
        setActiveProject(proj);
        setHasUnsavedChanges(false);
        setCurrentTab('workflow');
      } else {
        alert('Could not load project. It may have been deleted.');
      }
    } catch (err) {
      console.error('Failed to open project:', err);
    }
  };

  const handleStartFromTemplate = (template: DocumentTemplate) => {
    const newProj = createNewEmptyProject(template);
    setActiveProject(newProj);
    setHasUnsavedChanges(true);
    setCurrentTab('workflow');
  };

  const handleUpdateActiveProject = async (updated: EventProject) => {
    setActiveProject(updated);
    setHasUnsavedChanges(true);

    // Auto-save periodically to IndexedDB
    try {
      await saveProject(updated);
      setHasUnsavedChanges(false);
      refreshProjectList();
    } catch (err) {
      console.warn('Auto-save failed:', err);
    }
  };

  const handleManualSave = async () => {
    if (!activeProject) return;
    try {
      await saveProject(activeProject);
      setHasUnsavedChanges(false);
      await refreshProjectList();
    } catch (err) {
      alert('Failed to save project to browser storage.');
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const copy = await duplicateProject(projectId);
      await refreshProjectList();
      setActiveProject(copy);
      setCurrentTab('workflow');
    } catch (err) {
      console.error('Duplication failed:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      if (activeProject?.id === projectId) {
        setActiveProject(null);
      }
      await refreshProjectList();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleImportProjectJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const imported = validateAndParseProjectJson(text);
        await saveProject(imported);
        await refreshProjectList();
        setActiveProject(imported);
        setHasUnsavedChanges(false);
        setCurrentTab('workflow');
      } catch (err: any) {
        alert(`Failed to import JSON: ${err?.message || 'Invalid structure'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => {
          if (tab === 'workflow' && !activeProject) {
            handleCreateNewEvent();
          } else {
            setCurrentTab(tab);
          }
        }}
        activeProjectName={activeProject?.metadata.name}
        hasUnsavedChanges={hasUnsavedChanges}
        onSaveActiveProject={handleManualSave}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            recentProjects={recentProjects}
            onCreateNewEvent={handleCreateNewEvent}
            onOpenProject={handleOpenProject}
            onLoadDemoMode={handleLoadDemoMode}
            onImportProjectJson={handleImportProjectJson}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onStartFromTemplate={handleStartFromTemplate}
          />
        )}

        {currentTab === 'workflow' && activeProject && (
          <WorkflowContainer
            project={activeProject}
            onUpdateProject={handleUpdateActiveProject}
            onExitWorkflow={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'projects' && (
          <MyProjects
            projects={recentProjects}
            onOpenProject={handleOpenProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
            onImportProjectJson={handleImportProjectJson}
            onCreateNewProject={handleCreateNewEvent}
          />
        )}

        {currentTab === 'templates' && (
          <TemplatesGallery onStartEventWithTemplate={handleStartFromTemplate} />
        )}

        {currentTab === 'guide' && <HelpGuide />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
