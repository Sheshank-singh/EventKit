import React from 'react';
import {
  FileText,
  PlusCircle,
  FolderOpen,
  LayoutTemplate,
  HelpCircle,
  ShieldCheck,
  Save,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface NavbarProps {
  currentTab: 'dashboard' | 'workflow' | 'projects' | 'templates' | 'guide';
  onSelectTab: (tab: 'dashboard' | 'workflow' | 'projects' | 'templates' | 'guide') => void;
  activeProjectName?: string;
  hasUnsavedChanges?: boolean;
  onSaveActiveProject?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeProjectName,
  hasUnsavedChanges,
  onSaveActiveProject,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  EventKit
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-2 border border-indigo-100">
                  MVP
                </span>
              </div>
            </button>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => onSelectTab('workflow')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'workflow'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{activeProjectName ? 'Event Workflow' : 'Create Event'}</span>
              </button>

              <button
                onClick={() => onSelectTab('projects')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'projects'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>My Projects</span>
              </button>

              <button
                onClick={() => onSelectTab('templates')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'templates'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutTemplate className="w-4 h-4" />
                <span>Templates</span>
              </button>

              <button
                onClick={() => onSelectTab('guide')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'guide'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help / Guide</span>
              </button>
            </nav>
          </div>

          {/* Right Header: Active Project info & Privacy Pill */}
          <div className="flex items-center gap-3">
            {activeProjectName && (
              <div className="hidden lg:flex items-center gap-2 pr-2 border-r border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Project:</span>
                <span className="text-xs font-semibold text-slate-800 max-w-[150px] truncate">
                  {activeProjectName}
                </span>
                {onSaveActiveProject && (
                  <Button
                    size="sm"
                    variant={hasUnsavedChanges ? 'primary' : 'secondary'}
                    icon={hasUnsavedChanges ? <Save className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    onClick={onSaveActiveProject}
                    className="text-xs py-1 px-2.5 h-7"
                  >
                    {hasUnsavedChanges ? 'Save' : 'Saved'}
                  </Button>
                )}
              </div>
            )}

            {/* Privacy indicator */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-full px-3 py-1 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">100% Client-Side • Zero Cloud Storage</span>
              <span className="sm:hidden">Local & Private</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
