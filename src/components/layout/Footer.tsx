import React from 'react';
import { ShieldCheck, HardDrive, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <p className="font-semibold text-slate-800 text-sm mb-1">EventKit</p>
            <p className="text-slate-500">
              Bulk document automation for event organizers, colleges, workshops, and hackathons.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 md:items-center">
            <div className="flex items-center gap-1.5 text-slate-600">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              <span>Local IndexedDB Persistence • Zero External Server Uploads</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>In-browser PDF rendering using pdf-lib & Web Workers</span>
            </div>
          </div>

          <div className="md:text-right">
            <p className="text-slate-500">
              Notice: Clearing browser storage may delete locally saved projects. Export JSON backups regularly.
            </p>
            <p className="text-slate-400 mt-1 text-[11px]">
              ₹0 Budget • Free & Open Source Architecture
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
