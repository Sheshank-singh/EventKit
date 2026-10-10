export type EventType =
  | 'workshop'
  | 'competition'
  | 'conference'
  | 'hackathon'
  | 'training_program'
  | 'seminar'
  | 'webinar'
  | 'college_fest'
  | 'other';

export type DocumentCategory =
  | 'certificate'
  | 'letter'
  | 'id_card'
  | 'attendance'
  | 'custom';

export type PageFormat = 'A4' | 'LETTER' | 'ID_CR80' | 'CUSTOM';
export type PageOrientation = 'landscape' | 'portrait';

export interface PageDimensions {
  widthPt: number;
  heightPt: number;
}

export const PAGE_SIZES: Record<PageFormat, { portrait: PageDimensions; landscape: PageDimensions }> = {
  A4: {
    portrait: { widthPt: 595.28, heightPt: 841.89 },
    landscape: { widthPt: 841.89, heightPt: 595.28 },
  },
  LETTER: {
    portrait: { widthPt: 612, heightPt: 792 },
    landscape: { widthPt: 792, heightPt: 612 },
  },
  // CR80 credit card standard is 3.375 x 2.125 inches (243 x 153 pt)
  ID_CR80: {
    portrait: { widthPt: 153, heightPt: 243 },
    landscape: { widthPt: 243, heightPt: 153 },
  },
  CUSTOM: {
    portrait: { widthPt: 600, heightPt: 800 },
    landscape: { widthPt: 800, heightPt: 600 },
  },
};

export type FontFamily =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Times-Roman'
  | 'Times-Bold'
  | 'Courier'
  | 'Courier-Bold';

export type TextAlignment = 'left' | 'center' | 'right';

export interface TemplateField {
  id: string;
  key: string; // e.g. "full_name", "event_name", "role", "certificate_id"
  name: string; // human label e.g. "Participant Full Name"
  x: number; // normalized coordinate 0..1 (top-left based in UI)
  y: number; // normalized coordinate 0..1 (top-left based in UI)
  width: number; // normalized width 0..1
  height: number; // normalized height 0..1
  fontSize: number; // in pt
  minFontSize?: number; // for auto-shrinking long text
  fontFamily: FontFamily;
  color: string; // hex color e.g. "#1e293b"
  alignment: TextAlignment;
  isBold?: boolean;
  isStatic?: boolean;
  staticText?: string;
  isImage?: boolean;
  imageDataUrl?: string; // for static logos or signature images
  wrapText?: boolean;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'builtin' | 'custom_image' | 'custom_pdf';
  builtinTemplateId?: string;
  format: PageFormat;
  orientation: PageOrientation;
  widthPt: number;
  heightPt: number;
  backgroundImageDataUrl?: string; // PNG/JPEG background as data URL
  pdfBytesBase64?: string; // For uploaded PDF backgrounds
  fields: TemplateField[];
}

export type FieldMappingSource =
  | 'participant_column'
  | 'event_metadata'
  | 'static'
  | 'computed_cert_id';

export interface FieldMapping {
  fieldId: string;
  fieldKey: string;
  source: FieldMappingSource;
  columnKey?: string;
  metadataField?: 'eventName' | 'organizer' | 'startDate' | 'endDate' | 'location' | 'eventType';
  staticValue?: string;
  formatPattern?: string; // e.g. uppercase, date format
}

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'is_not_empty'
  | 'is_empty';

export interface GenerationRule {
  id: string;
  columnKey: string;
  operator: RuleOperator;
  value: string;
}

export interface DocumentType {
  id: string;
  name: string;
  category: DocumentCategory;
  template: DocumentTemplate;
  rules: GenerationRule[]; // Combined with AND
  fieldMappings: FieldMapping[];
  isEnabled: boolean;
  outputSubfolder?: string; // e.g. "Certificates", "Letters", "ID-Cards"
}

export type MappedStandardColumn =
  | 'full_name'
  | 'email'
  | 'phone'
  | 'organization'
  | 'role'
  | 'category'
  | 'award'
  | 'attendance'
  | 'certificate_id'
  | 'custom';

export interface ParticipantColumn {
  key: string;
  originalHeader: string;
  mappedType: MappedStandardColumn;
  sampleValues: string[];
}

export interface Participant {
  id: string; // internal stable unique uuid/id
  rowNumber: number; // 1-based original spreadsheet row
  data: Record<string, string>; // normalized key -> value
  isExcluded: boolean;
  exclusionReason?: string;
  validationErrors?: string[];
  certificateIdOverrides?: Record<string, string>; // documentTypeId -> certId
}

export interface EventMetadata {
  name: string;
  organizer: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  location: string;
  isOnline: boolean;
  description?: string;
}

export type NamingConvention =
  | 'event_name_doc_id'
  | 'name_doc_event'
  | 'doc_name_id'
  | 'id_name';

export interface ProjectSettings {
  certificateIdPrefix: string;
  certificateIdPadding: number;
  namingConvention: NamingConvention;
  zipBatchFolderStructure: boolean; // Creates EventName/Certificates, etc.
}

export interface EventProject {
  id: string;
  metadata: EventMetadata;
  createdAt: string;
  updatedAt: string;
  columns: ParticipantColumn[];
  participants: Participant[];
  documentTypes: DocumentType[];
  settings: ProjectSettings;
}

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  detail?: string;
  rowNumber?: number;
  participantId?: string;
  documentTypeId?: string;
  documentTypeName?: string;
  fieldKey?: string;
  canExcludeRecord?: boolean;
}

export interface GeneratedDocument {
  id: string;
  participantId: string;
  participantName: string;
  documentTypeId: string;
  documentTypeName: string;
  documentCategory: DocumentCategory;
  filename: string;
  subfolder: string;
  certificateId: string;
  status: 'success' | 'failed' | 'excluded' | 'skipped';
  errorMessage?: string;
  pdfBytes?: Uint8Array;
}

export interface GenerationReportItem {
  rowNumber: number;
  participantName: string;
  email: string;
  documentType: string;
  status: 'SUCCESS' | 'FAILED' | 'EXCLUDED' | 'SKIPPED';
  certificateId: string;
  filename: string;
  reason?: string;
}

export interface GenerationReport {
  projectId: string;
  eventName: string;
  timestamp: string;
  totalParticipants: number;
  totalEligible: number;
  totalGenerated: number;
  totalFailed: number;
  totalExcluded: number;
  totalSkipped: number;
  items: GenerationReportItem[];
}
