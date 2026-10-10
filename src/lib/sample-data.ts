import { EventProject, Participant, ParticipantColumn, DocumentType } from '../types';
import { getBuiltinTemplates } from './builtin-templates';

export function createSampleEventProject(): EventProject {
  const templates = getBuiltinTemplates();
  const participationTemplate = templates[0];
  const winnerTemplate = templates[1];
  const letterTemplate = templates[2];
  const idTemplate = templates[3];

  const columns: ParticipantColumn[] = [
    { key: 'full_name', originalHeader: 'Full Name', mappedType: 'full_name', sampleValues: ['Aarav Sharma', 'Priya Patel', 'Rohan Gupta'] },
    { key: 'email', originalHeader: 'Email Address', mappedType: 'email', sampleValues: ['aarav.sharma@example.edu', 'priya.patel@example.edu'] },
    { key: 'organization', originalHeader: 'College / Organization', mappedType: 'organization', sampleValues: ['IIT Delhi', 'NIT Trichy', 'BITS Pilani'] },
    { key: 'role', originalHeader: 'Event Role', mappedType: 'role', sampleValues: ['Participant', 'Judge', 'Speaker', 'Volunteer'] },
    { key: 'track', originalHeader: 'Project Track', mappedType: 'category', sampleValues: ['AI & Robotics', 'Fintech', 'HealthTech'] },
    { key: 'award', originalHeader: 'Award / Prize', mappedType: 'award', sampleValues: ['First Place', 'Second Place', 'Third Place'] },
    { key: 'attendance', originalHeader: 'Attendance Status', mappedType: 'attendance', sampleValues: ['Present', 'Absent'] },
  ];

  const sampleRawRows = [
    { full_name: 'Aarav Sharma', email: 'aarav.sharma@example.edu', organization: 'Apex Institute of Technology', role: 'Participant', track: 'AI & Robotics', award: 'First Place', attendance: 'Present' },
    { full_name: 'Priya Patel', email: 'priya.patel@example.edu', organization: 'National Engineering College', role: 'Participant', track: 'Fintech', award: 'Second Place', attendance: 'Present' },
    { full_name: 'Rohan Gupta', email: 'rohan.gupta@example.edu', organization: 'Vellore Tech University', role: 'Participant', track: 'HealthTech', award: 'Third Place', attendance: 'Present' },
    { full_name: 'Ananya Verma', email: 'ananya.verma@example.edu', organization: 'Apex Institute of Technology', role: 'Participant', track: 'AI & Robotics', award: '', attendance: 'Present' },
    { full_name: 'Vikramaditya Rao', email: 'vikram.rao@example.edu', organization: 'State University', role: 'Participant', track: 'CleanTech', award: '', attendance: 'Present' },
    { full_name: 'Sneha Deshmukh', email: 'sneha.d@example.edu', organization: 'City Polytechnic', role: 'Participant', track: 'EdTech', award: '', attendance: 'Present' },
    { full_name: 'Kavita Sundaram', email: 'kavita.s@example.edu', organization: 'Tech Research Labs', role: 'Judge', track: 'Jury Panel', award: '', attendance: 'Present' },
    { full_name: 'Dr. Rajesh Iyer', email: 'rajesh.iyer@example.edu', organization: 'Global AI Institute', role: 'Speaker', track: 'Keynote Track', award: '', attendance: 'Present' },
    { full_name: 'Sameer Khan', email: 'sameer.khan@example.edu', organization: 'Apex Institute of Technology', role: 'Volunteer', track: 'Logistics', award: '', attendance: 'Present' },
    { full_name: 'Neha Nair', email: 'neha.nair@example.edu', organization: 'Apex Institute of Technology', role: 'Participant', track: 'Web3', award: '', attendance: 'Absent' },
  ];

  const participants: Participant[] = sampleRawRows.map((row, idx) => ({
    id: `sample_p_${idx + 1}`,
    rowNumber: idx + 2,
    data: row,
    isExcluded: false,
    validationErrors: row.attendance === 'Absent' ? ['Marked as Absent'] : undefined,
  }));

  const docTypes: DocumentType[] = [
    {
      id: 'dt_participation',
      name: 'Participation Certificate',
      category: 'certificate',
      isEnabled: true,
      template: participationTemplate,
      rules: [
        { id: 'r_part_1', columnKey: 'attendance', operator: 'equals', value: 'Present' },
      ],
      fieldMappings: [
        { fieldId: 'f_full_name', fieldKey: 'full_name', source: 'participant_column', columnKey: 'full_name' },
        { fieldId: 'f_date', fieldKey: 'event_date', source: 'event_metadata', metadataField: 'startDate' },
        { fieldId: 'f_cert_id', fieldKey: 'certificate_id', source: 'computed_cert_id' },
      ],
      outputSubfolder: 'Certificates',
    },
    {
      id: 'dt_winner',
      name: 'Winner Certificate',
      category: 'certificate',
      isEnabled: true,
      template: winnerTemplate,
      rules: [
        { id: 'r_win_1', columnKey: 'award', operator: 'is_not_empty', value: '' },
      ],
      fieldMappings: [
        { fieldId: 'w_full_name', fieldKey: 'full_name', source: 'participant_column', columnKey: 'full_name' },
        { fieldId: 'w_award', fieldKey: 'award', source: 'participant_column', columnKey: 'award' },
        { fieldId: 'w_cert_id', fieldKey: 'certificate_id', source: 'computed_cert_id' },
      ],
      outputSubfolder: 'Certificates',
    },
    {
      id: 'dt_letter',
      name: 'Speaker & Judge Letter',
      category: 'letter',
      isEnabled: true,
      template: letterTemplate,
      rules: [
        { id: 'r_let_1', columnKey: 'role', operator: 'not_equals', value: 'Participant' },
      ],
      fieldMappings: [
        { fieldId: 'l_org', fieldKey: 'organizer', source: 'event_metadata', metadataField: 'organizer' },
        { fieldId: 'l_date', fieldKey: 'event_date', source: 'event_metadata', metadataField: 'startDate' },
        { fieldId: 'l_salutation', fieldKey: 'salutation', source: 'participant_column', columnKey: 'full_name' },
      ],
      outputSubfolder: 'Letters',
    },
    {
      id: 'dt_id_card',
      name: 'Participant ID Badge',
      category: 'id_card',
      isEnabled: true,
      template: idTemplate,
      rules: [
        { id: 'r_id_1', columnKey: 'role', operator: 'equals', value: 'Participant' },
      ],
      fieldMappings: [
        { fieldId: 'id_event', fieldKey: 'event_name', source: 'event_metadata', metadataField: 'eventName' },
        { fieldId: 'id_name', fieldKey: 'full_name', source: 'participant_column', columnKey: 'full_name' },
        { fieldId: 'id_org', fieldKey: 'organization', source: 'participant_column', columnKey: 'organization' },
        { fieldId: 'id_role', fieldKey: 'role', source: 'participant_column', columnKey: 'role' },
        { fieldId: 'id_cert_id', fieldKey: 'certificate_id', source: 'computed_cert_id' },
      ],
      outputSubfolder: 'ID-Cards',
    },
  ];

  return {
    id: `proj_demo_${Date.now()}`,
    metadata: {
      name: 'National Hackathon & Tech Summit 2026',
      organizer: 'Apex Institute of Technology',
      eventType: 'hackathon',
      startDate: '2026-11-14',
      endDate: '2026-11-16',
      location: 'Innovation Hub, Campus Auditorium',
      isOnline: false,
      description: 'Annual inter-college hackathon with 48-hour prototype challenge, keynote tracks, and jury evaluations.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    columns,
    participants,
    documentTypes: docTypes,
    settings: {
      certificateIdPrefix: 'HACK26',
      certificateIdPadding: 4,
      namingConvention: 'event_name_doc_id',
      zipBatchFolderStructure: true,
    },
  };
}
