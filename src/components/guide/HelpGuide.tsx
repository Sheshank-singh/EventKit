import React from 'react';
import { Button } from '../ui/Button';
import {
  Download,
  HelpCircle,
  FileSpreadsheet,
  ShieldCheck,
  FileCode,
  Layers,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { triggerFileDownload } from '../../lib/zip-exporter';

export const HelpGuide: React.FC = () => {
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'Full Name,Email,Organization,Role,Track,Award,Attendance\r\n' +
      'Aarav Sharma,aarav@example.edu,Apex Institute,Participant,AI Track,First Place,Present\r\n' +
      'Priya Patel,priya@example.edu,National Tech,Participant,Fintech,Second Place,Present\r\n' +
      'Rohan Gupta,rohan@example.edu,City College,Participant,HealthTech,,Present\r\n' +
      'Kavita Sundaram,kavita@example.edu,Research Labs,Judge,Jury Panel,,Present\r\n' +
      'Dr. Rajesh Iyer,rajesh@example.edu,AI Institute,Speaker,Keynote,,Present\r\n' +
      'Sameer Khan,sameer@example.edu,Apex Institute,Volunteer,Operations,,Present\r\n' +
      'Neha Nair,neha@example.edu,Apex Institute,Participant,Web3,,Absent\r\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, 'eventkit_sample_participants.csv', 'text/csv');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">EventKit User Guide & FAQ</h1>
        <p className="text-xs text-slate-500 mt-1">
          Everything you need to know about preparing spreadsheets, designing templates, mapping variables, and bulk exporting.
        </p>
      </div>

      {/* Quick Download Sample */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Need a Sample Spreadsheet?</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md">
            Download our curated CSV template pre-populated with realistic attendee names, roles, attendance statuses, and prizes.
          </p>
        </div>
        <Button
          size="md"
          variant="primary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleDownloadSampleCsv}
        >
          Download Sample CSV
        </Button>
      </div>

      {/* Section 1: Workflow Overview */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          Spreadsheet Formatting Guide
        </h2>
        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            EventKit accepts <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> files. When structuring your attendee list:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
            <li>
              <strong>Header Row:</strong> Make sure row 1 (or the first non-empty row) contains column headers like <em>Full Name</em>, <em>Email</em>, <em>Role</em>, <em>Award</em>, etc.
            </li>
            <li>
              <strong>Whitespace:</strong> Extra spaces around names or values are automatically trimmed without altering capitalization or spelling.
            </li>
            <li>
              <strong>Duplicates:</strong> EventKit detects repeated emails or identical names, displaying row numbers so you can exclude or edit them before generation.
            </li>
            <li>
              <strong>No Silent Discards:</strong> Rows are never silently dropped; any row with an issue is flagged as a warning in the data review table.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 2: Template Variables Reference */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileCode className="w-5 h-5 text-indigo-600" />
          Template Variable Reference
        </h2>
        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            Any text field placed on your document can bind to dynamic variables. Standard recognized keys include:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <code className="text-indigo-600 font-bold block mb-1">{'{{full_name}}'}</code>
              <p className="text-slate-600">The recipient's full name from the participant spreadsheet.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <code className="text-indigo-600 font-bold block mb-1">{'{{certificate_id}}'}</code>
              <p className="text-slate-600">Deterministic unique ID (e.g. CERT-0001, HACK26-0042).</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <code className="text-indigo-600 font-bold block mb-1">{'{{event_name}}'}</code>
              <p className="text-slate-600">The title of the event configured in Step 1.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <code className="text-indigo-600 font-bold block mb-1">{'{{event_date}}'}</code>
              <p className="text-slate-600">Formatted start date or date range of the event.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <code className="text-indigo-600 font-bold block mb-1">{'{{organizer}}'}</code>
              <p className="text-slate-600">The host college, NGO, or organization name.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <code className="text-indigo-600 font-bold block mb-1">{'{{role}}'} / {'{{award}}'}</code>
              <p className="text-slate-600">Attendee role (Participant, Judge) or award (First Place).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Privacy & Zero-Budget Security */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          100% Client-Side Privacy Architecture
        </h2>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            EventKit was built with privacy as a foundational product feature:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
            <li><strong>Zero Server Uploads:</strong> Participant spreadsheets are parsed locally in your web browser. Neither participant names, emails, nor contact details are ever sent to an external server.</li>
            <li><strong>In-Browser PDF Rendering:</strong> Document generation happens on your device's CPU using WebAssembly and Web Workers through <code>pdf-lib</code> and <code>JSZip</code>.</li>
            <li><strong>No Tracking / Telemetry:</strong> There are no third-party tracking scripts, advertising SDKs, or data harvesting mechanisms.</li>
            <li><strong>Local Persistence:</strong> Projects are saved directly into your browser's IndexedDB storage.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
