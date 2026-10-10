import React, { useState } from 'react';
import { EventMetadata, EventType } from '../../types';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { ArrowRight, Calendar, Building, MapPin, Globe, Sparkles } from 'lucide-react';

export interface Step1Props {
  metadata: EventMetadata;
  onChange: (metadata: EventMetadata) => void;
  onNext: () => void;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'workshop', label: 'Workshop / Hands-on Lab' },
  { value: 'competition', label: 'Competition / Contest' },
  { value: 'hackathon', label: 'Hackathon / Codefest' },
  { value: 'conference', label: 'Academic Conference' },
  { value: 'training_program', label: 'Training Program / Bootcamp' },
  { value: 'seminar', label: 'Seminar / Guest Lecture' },
  { value: 'webinar', label: 'Webinar / Online Session' },
  { value: 'college_fest', label: 'College Cultural/Tech Fest' },
  { value: 'other', label: 'Other Document Event' },
];

export const Step1EventDetails: React.FC<Step1Props> = ({ metadata, onChange, onNext }) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadata.name || metadata.name.trim() === '') {
      setError('Event name is required.');
      return;
    }
    if (metadata.startDate && metadata.endDate) {
      if (new Date(metadata.startDate) > new Date(metadata.endDate)) {
        setError('Start date cannot be after end date.');
        return;
      }
    }
    setError(null);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Event Information</h2>
          <p className="text-xs text-slate-500 mt-1">
            Specify the primary event attributes. These can be inserted dynamically into certificate and letter templates using variables like <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{'{{event_name}}'}</code>.
          </p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          {/* Event Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
              Event Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. National Hackathon & Innovation Summit 2026"
              value={metadata.name}
              onChange={e => onChange({ ...metadata, name: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Organizer */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                Organizer / Host Institution
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Apex Institute of Technology"
                  value={metadata.organizer}
                  onChange={e => onChange({ ...metadata, organizer: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                Event Type
              </label>
              <select
                value={metadata.eventType}
                onChange={e => onChange({ ...metadata, eventType: e.target.value as EventType })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={metadata.startDate}
                  onChange={e => onChange({ ...metadata, startDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                End Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={metadata.endDate}
                  onChange={e => onChange({ ...metadata, endDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Location & Online Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Event Location / Mode
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={metadata.isOnline}
                  onChange={e =>
                    onChange({
                      ...metadata,
                      isOnline: e.target.checked,
                      location: e.target.checked ? 'Virtual / Online' : metadata.location,
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Online / Virtual Event</span>
              </label>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={metadata.isOnline ? 'Virtual (Zoom / Google Meet)' : 'e.g. Campus Auditorium, Tech Campus, Bengaluru'}
                value={metadata.location}
                onChange={e => onChange({ ...metadata, location: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
              Event Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide context, agenda highlights, or certification criteria..."
              value={metadata.description || ''}
              onChange={e => onChange({ ...metadata, description: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          variant="primary"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Save & Proceed to Participant Data
        </Button>
      </div>
    </form>
  );
};
