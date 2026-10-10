import { DocumentTemplate, TemplateField, PAGE_SIZES } from '../types';

/**
 * Creates an SVG data URI for Participation Certificate
 */
function createParticipationCertSvg(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309" />
      <stop offset="35%" stop-color="#f59e0b" />
      <stop offset="70%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Outer Double Borders -->
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="8" fill="none" stroke="url(#goldGrad)" stroke-width="4" />
  <rect x="32" y="32" width="${width - 64}" height="${height - 64}" rx="6" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-opacity="0.7" />

  <!-- Decorative Corner Accents -->
  <path d="M 44 44 L 90 44 M 44 44 L 44 90" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" fill="none" />
  <path d="M ${width - 44} 44 L ${width - 90} 44 M ${width - 44} 44 L ${width - 44} 90" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" fill="none" />
  <path d="M 44 ${height - 44} L 90 ${height - 44} M 44 ${height - 44} L 44 ${height - 90}" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" fill="none" />
  <path d="M ${width - 44} ${height - 44} L ${width - 90} ${height - 44} M ${width - 44} ${height - 44} L ${width - 44} ${height - 90}" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" fill="none" />

  <!-- Emblem / Seal on bottom left -->
  <g transform="translate(100, ${height - 110})">
    <circle cx="0" cy="0" r="34" fill="url(#goldGrad)" opacity="0.15" />
    <circle cx="0" cy="0" r="30" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="4,2" />
    <circle cx="0" cy="0" r="24" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
    <polygon points="0,-14 4,-4 14,-4 6,3 9,13 0,7 -9,13 -6,3 -14,-4 -4,-4" fill="url(#goldGrad)" />
  </g>

  <!-- Signatures Decorative Lines -->
  <line x1="${width - 280}" y1="${height - 105}" x2="${width - 100}" y2="${height - 105}" stroke="#94a3b8" stroke-width="1" />
  <line x1="160" y1="${height - 105}" x2="340" y2="${height - 105}" stroke="#94a3b8" stroke-width="1" />
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Creates SVG data URI for Winner Certificate
 */
function createWinnerCertSvg(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="winnerGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="winnerIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="#fafaf9" />

  <!-- Header Banner Ribbon -->
  <polygon points="0,0 ${width},0 ${width},32 0,32" fill="url(#winnerIndigo)" />
  <polygon points="0,32 ${width},32 ${width},36 0,36" fill="url(#winnerGold)" />

  <!-- Frame -->
  <rect x="28" y="52" width="${width - 56}" height="${height - 80}" rx="6" fill="none" stroke="url(#winnerGold)" stroke-width="3" />
  <rect x="34" y="58" width="${width - 68}" height="${height - 92}" rx="4" fill="none" stroke="#4338ca" stroke-width="1" stroke-opacity="0.4" />

  <!-- Trophy Icon badge -->
  <g transform="translate(${width / 2}, 95)">
    <circle cx="0" cy="0" r="28" fill="url(#winnerGold)" opacity="0.2" />
    <circle cx="0" cy="0" r="24" fill="none" stroke="url(#winnerGold)" stroke-width="2" />
    <path d="M -9,-10 L 9,-10 L 7,3 C 6,8 0,11 0,11 C 0,11 -6,8 -7,3 Z" fill="url(#winnerGold)" />
    <path d="M -9,-6 C -14,-6 -14,1 -9,2" fill="none" stroke="url(#winnerGold)" stroke-width="2" />
    <path d="M 9,-6 C 14,-6 14,1 9,2" fill="none" stroke="url(#winnerGold)" stroke-width="2" />
    <rect x="-3" y="11" width="6" height="4" fill="url(#winnerGold)" />
    <rect x="-7" y="15" width="14" height="2" rx="1" fill="url(#winnerGold)" />
  </g>

  <!-- Signature Lines -->
  <line x1="160" y1="${height - 95}" x2="340" y2="${height - 95}" stroke="#94a3b8" stroke-width="1" />
  <line x1="${width - 340}" y1="${height - 95}" x2="${width - 160}" y2="${height - 95}" stroke="#94a3b8" stroke-width="1" />
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Creates SVG data URI for Formal Letterhead
 */
function createFormalLetterSvg(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="#ffffff" />

  <!-- Modern Top Letterhead Bar -->
  <rect x="0" y="0" width="${width}" height="12" fill="url(#headerGrad)" />
  <rect x="0" y="12" width="${width}" height="3" fill="#6366f1" />

  <!-- Decorative Top Right Watermark Geometry -->
  <circle cx="${width - 40}" cy="50" r="28" fill="#f1f5f9" opacity="0.6" />
  <circle cx="${width - 60}" cy="40" r="16" fill="#e2e8f0" opacity="0.4" />

  <!-- Bottom Letterhead Footer Bar -->
  <rect x="40" y="${height - 35}" width="${width - 80}" height="1" fill="#e2e8f0" />
  <rect x="0" y="${height - 6}" width="${width}" height="6" fill="#0f172a" />
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Creates SVG data URI for Participant ID Card (CR80 standard)
 */
function createIdCardSvg(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />

  <!-- Top Lanyard Hole Punch Marker -->
  <rect x="${width / 2 - 14}" y="6" width="28" height="5" rx="2.5" fill="#cbd5e1" opacity="0.6" />

  <!-- Header Banner -->
  <path d="M 0 16 L ${width} 16 L ${width} 68 L 0 68 Z" fill="url(#cardGrad)" />

  <!-- Avatar Placeholder Box -->
  <circle cx="${width / 2}" cy="100" r="26" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
  <circle cx="${width / 2}" cy="94" r="10" fill="#cbd5e1" />
  <path d="M ${width / 2 - 16} 118 C ${width / 2 - 16} 108 ${width / 2 + 16} 108 ${width / 2 + 16} 118 Z" fill="#cbd5e1" />

  <!-- Role Pill Background -->
  <rect x="20" y="166" width="${width - 40}" height="20" rx="10" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1" />

  <!-- Bottom Barcode Simulation -->
  <g transform="translate(24, ${height - 24})" opacity="0.6">
    <rect x="0" y="0" width="2" height="12" fill="#0f172a" />
    <rect x="4" y="0" width="1" height="12" fill="#0f172a" />
    <rect x="7" y="0" width="3" height="12" fill="#0f172a" />
    <rect x="12" y="0" width="1" height="12" fill="#0f172a" />
    <rect x="15" y="0" width="2" height="12" fill="#0f172a" />
    <rect x="19" y="0" width="4" height="12" fill="#0f172a" />
    <rect x="25" y="0" width="1" height="12" fill="#0f172a" />
    <rect x="28" y="0" width="2" height="12" fill="#0f172a" />
    <rect x="32" y="0" width="3" height="12" fill="#0f172a" />
    <rect x="37" y="0" width="1" height="12" fill="#0f172a" />
    <rect x="40" y="0" width="2" height="12" fill="#0f172a" />
    <rect x="44" y="0" width="4" height="12" fill="#0f172a" />
    <rect x="50" y="0" width="1" height="12" fill="#0f172a" />
    <rect x="53" y="0" width="3" height="12" fill="#0f172a" />
    <rect x="58" y="0" width="2" height="12" fill="#0f172a" />
    <rect x="62" y="0" width="1" height="12" fill="#0f172a" />
    <rect x="65" y="0" width="3" height="12" fill="#0f172a" />
    <rect x="70" y="0" width="2" height="12" fill="#0f172a" />
    <rect x="74" y="0" width="4" height="12" fill="#0f172a" />
    <rect x="80" y="0" width="2" height="12" fill="#0f172a" />
    <rect x="84" y="0" width="1" height="12" fill="#0f172a" />
    <rect x="87" y="0" width="3" height="12" fill="#0f172a" />
    <rect x="92" y="0" width="2" height="12" fill="#0f172a" />
    <rect x="96" y="0" width="4" height="12" fill="#0f172a" />
    <rect x="102" y="0" width="2" height="12" fill="#0f172a" />
  </g>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Creates SVG data URI for Volunteer ID Card
 */
function createVolunteerIdCardSvg(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="volGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
  <rect x="${width / 2 - 14}" y="6" width="28" height="5" rx="2.5" fill="#cbd5e1" opacity="0.6" />

  <path d="M 0 16 L ${width} 16 L ${width} 68 L 0 68 Z" fill="url(#volGrad)" />

  <circle cx="${width / 2}" cy="100" r="26" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="2" />
  <circle cx="${width / 2}" cy="94" r="10" fill="#10b981" />
  <path d="M ${width / 2 - 16} 118 C ${width / 2 - 16} 108 ${width / 2 + 16} 108 ${width / 2 + 16} 118 Z" fill="#10b981" />

  <rect x="18" y="166" width="${width - 36}" height="22" rx="11" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5" />
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Library of Starter Built-in Templates
 */
export function getBuiltinTemplates(): DocumentTemplate[] {
  const a4Land = PAGE_SIZES.A4.landscape;
  const a4Port = PAGE_SIZES.A4.portrait;
  const idCr80Port = PAGE_SIZES.ID_CR80.portrait;

  // 1. Participation Certificate
  const participationCert: DocumentTemplate = {
    id: 'template_participation_cert',
    name: 'Participation Certificate (Classic)',
    type: 'builtin',
    builtinTemplateId: 'cert_participation',
    format: 'A4',
    orientation: 'landscape',
    widthPt: a4Land.widthPt,
    heightPt: a4Land.heightPt,
    backgroundImageDataUrl: createParticipationCertSvg(a4Land.widthPt, a4Land.heightPt),
    fields: [
      {
        id: 'f_title',
        key: 'cert_title',
        name: 'Certificate Title',
        x: 0.1,
        y: 0.14,
        width: 0.8,
        height: 0.08,
        fontSize: 26,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        alignment: 'center',
        isStatic: true,
        staticText: 'CERTIFICATE OF PARTICIPATION',
      },
      {
        id: 'f_presented_to',
        key: 'presented_text',
        name: 'Presented To Label',
        x: 0.2,
        y: 0.25,
        width: 0.6,
        height: 0.04,
        fontSize: 13,
        fontFamily: 'Times-Roman',
        color: '#64748b',
        alignment: 'center',
        isStatic: true,
        staticText: 'This certificate is proudly presented to',
      },
      {
        id: 'f_full_name',
        key: 'full_name',
        name: 'Participant Full Name',
        x: 0.1,
        y: 0.32,
        width: 0.8,
        height: 0.11,
        fontSize: 32,
        minFontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#312e81',
        alignment: 'center',
      },
      {
        id: 'f_body',
        key: 'body_text',
        name: 'Certification Statement',
        x: 0.15,
        y: 0.48,
        width: 0.7,
        height: 0.16,
        fontSize: 13,
        minFontSize: 10,
        fontFamily: 'Times-Roman',
        color: '#334155',
        alignment: 'center',
        wrapText: true,
        isStatic: true,
        staticText:
          'for active participation in {{event_name}}, demonstrating commendable dedication, learning engagement, and collaboration throughout the sessions organized by {{organizer}}.',
      },
      {
        id: 'f_date',
        key: 'event_date',
        name: 'Event Date',
        x: 0.18,
        y: 0.74,
        width: 0.25,
        height: 0.05,
        fontSize: 11,
        fontFamily: 'Helvetica',
        color: '#475569',
        alignment: 'center',
      },
      {
        id: 'f_sign1',
        key: 'signatory_1',
        name: 'Coordinator Title',
        x: 0.18,
        y: 0.82,
        width: 0.25,
        height: 0.05,
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        alignment: 'center',
        isStatic: true,
        staticText: 'Event Coordinator',
      },
      {
        id: 'f_sign2',
        key: 'signatory_2',
        name: 'Institution Head Title',
        x: 0.58,
        y: 0.82,
        width: 0.25,
        height: 0.05,
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        alignment: 'center',
        isStatic: true,
        staticText: 'Director / Principal',
      },
      {
        id: 'f_cert_id',
        key: 'certificate_id',
        name: 'Certificate ID',
        x: 0.58,
        y: 0.74,
        width: 0.25,
        height: 0.05,
        fontSize: 10,
        fontFamily: 'Courier',
        color: '#64748b',
        alignment: 'center',
      },
    ],
  };

  // 2. Winner / Achievement Certificate
  const winnerCert: DocumentTemplate = {
    id: 'template_winner_cert',
    name: 'Winner / Achievement Certificate (Royal)',
    type: 'builtin',
    builtinTemplateId: 'cert_winner',
    format: 'A4',
    orientation: 'landscape',
    widthPt: a4Land.widthPt,
    heightPt: a4Land.heightPt,
    backgroundImageDataUrl: createWinnerCertSvg(a4Land.widthPt, a4Land.heightPt),
    fields: [
      {
        id: 'w_title',
        key: 'cert_title',
        name: 'Title',
        x: 0.1,
        y: 0.22,
        width: 0.8,
        height: 0.07,
        fontSize: 28,
        fontFamily: 'Helvetica-Bold',
        color: '#1e1b4b',
        alignment: 'center',
        isStatic: true,
        staticText: 'CERTIFICATE OF ACHIEVEMENT',
      },
      {
        id: 'w_presented_to',
        key: 'presented_text',
        name: 'Presented Text',
        x: 0.2,
        y: 0.31,
        width: 0.6,
        height: 0.04,
        fontSize: 13,
        fontFamily: 'Times-Roman',
        color: '#64748b',
        alignment: 'center',
        isStatic: true,
        staticText: 'This award is proudly conferred upon',
      },
      {
        id: 'w_full_name',
        key: 'full_name',
        name: 'Winner Full Name',
        x: 0.1,
        y: 0.37,
        width: 0.8,
        height: 0.11,
        fontSize: 34,
        minFontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#b45309',
        alignment: 'center',
      },
      {
        id: 'w_award',
        key: 'award',
        name: 'Award Position / Prize',
        x: 0.2,
        y: 0.50,
        width: 0.6,
        height: 0.06,
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#4338ca',
        alignment: 'center',
      },
      {
        id: 'w_body',
        key: 'body_text',
        name: 'Achievement Description',
        x: 0.15,
        y: 0.58,
        width: 0.7,
        height: 0.14,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        color: '#334155',
        alignment: 'center',
        wrapText: true,
        isStatic: true,
        staticText:
          'in recognition of outstanding skill, innovation, and exemplary performance at {{event_name}}, hosted by {{organizer}}.',
      },
      {
        id: 'w_sign1',
        key: 'signatory_1',
        name: 'Judge / Convener',
        x: 0.18,
        y: 0.84,
        width: 0.25,
        height: 0.05,
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        alignment: 'center',
        isStatic: true,
        staticText: 'Chief Judge',
      },
      {
        id: 'w_sign2',
        key: 'signatory_2',
        name: 'Director Signature',
        x: 0.58,
        y: 0.84,
        width: 0.25,
        height: 0.05,
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        alignment: 'center',
        isStatic: true,
        staticText: 'Organizing Chair',
      },
      {
        id: 'w_cert_id',
        key: 'certificate_id',
        name: 'Verification ID',
        x: 0.58,
        y: 0.76,
        width: 0.25,
        height: 0.05,
        fontSize: 10,
        fontFamily: 'Courier',
        color: '#64748b',
        alignment: 'center',
      },
    ],
  };

  // 3. Formal Letter (Appreciation / Speaker / Judge)
  const formalLetter: DocumentTemplate = {
    id: 'template_formal_letter',
    name: 'Formal Appreciation Letter',
    type: 'builtin',
    builtinTemplateId: 'letter_formal',
    format: 'A4',
    orientation: 'portrait',
    widthPt: a4Port.widthPt,
    heightPt: a4Port.heightPt,
    backgroundImageDataUrl: createFormalLetterSvg(a4Port.widthPt, a4Port.heightPt),
    fields: [
      {
        id: 'l_org',
        key: 'organizer',
        name: 'Organizer Header',
        x: 0.08,
        y: 0.04,
        width: 0.6,
        height: 0.04,
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        alignment: 'left',
      },
      {
        id: 'l_date',
        key: 'event_date',
        name: 'Letter Date',
        x: 0.68,
        y: 0.04,
        width: 0.24,
        height: 0.03,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#64748b',
        alignment: 'right',
      },
      {
        id: 'l_title',
        key: 'letter_title',
        name: 'Letter Subject',
        x: 0.08,
        y: 0.12,
        width: 0.84,
        height: 0.04,
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#312e81',
        alignment: 'left',
        isStatic: true,
        staticText: 'LETTER OF APPRECIATION & RECOGNITION',
      },
      {
        id: 'l_salutation',
        key: 'salutation',
        name: 'Salutation',
        x: 0.08,
        y: 0.18,
        width: 0.84,
        height: 0.03,
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1e293b',
        alignment: 'left',
        isStatic: true,
        staticText: 'Dear {{full_name}},',
      },
      {
        id: 'l_body',
        key: 'letter_body',
        name: 'Letter Body Paragraph',
        x: 0.08,
        y: 0.23,
        width: 0.84,
        height: 0.35,
        fontSize: 11,
        minFontSize: 9,
        fontFamily: 'Times-Roman',
        color: '#334155',
        alignment: 'left',
        wrapText: true,
        isStatic: true,
        staticText:
          'On behalf of {{organizer}}, we extend our deepest gratitude for your invaluable contribution as a valued {{role}} at {{event_name}}.\n\nYour expertise, dedication, and leadership enriched the experience of all attendees and contributed immeasurably to the overall success of the initiative. We sincerely appreciate your time, effort, and commitment.\n\nWe wish you continued success in your professional endeavors and look forward to collaborating with you again.',
      },
      {
        id: 'l_closing',
        key: 'letter_closing',
        name: 'Sign-off and Signature',
        x: 0.08,
        y: 0.68,
        width: 0.45,
        height: 0.14,
        fontSize: 11,
        fontFamily: 'Helvetica',
        color: '#1e293b',
        alignment: 'left',
        wrapText: true,
        isStatic: true,
        staticText: 'Sincerely,\n\nExecutive Committee\n{{organizer}}\nRef ID: {{certificate_id}}',
      },
    ],
  };

  // 4. Participant ID Card
  const participantIdCard: DocumentTemplate = {
    id: 'template_participant_id_card',
    name: 'Participant ID Badge (CR80)',
    type: 'builtin',
    builtinTemplateId: 'id_participant',
    format: 'ID_CR80',
    orientation: 'portrait',
    widthPt: idCr80Port.widthPt,
    heightPt: idCr80Port.heightPt,
    backgroundImageDataUrl: createIdCardSvg(idCr80Port.widthPt, idCr80Port.heightPt),
    fields: [
      {
        id: 'id_event',
        key: 'event_name',
        name: 'Event Name Header',
        x: 0.06,
        y: 0.09,
        width: 0.88,
        height: 0.09,
        fontSize: 9,
        minFontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        alignment: 'center',
        wrapText: true,
      },
      {
        id: 'id_name',
        key: 'full_name',
        name: 'Full Name',
        x: 0.05,
        y: 0.52,
        width: 0.90,
        height: 0.10,
        fontSize: 12,
        minFontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        alignment: 'center',
      },
      {
        id: 'id_org',
        key: 'organization',
        name: 'Organization / College',
        x: 0.05,
        y: 0.61,
        width: 0.90,
        height: 0.07,
        fontSize: 8,
        minFontSize: 6,
        fontFamily: 'Helvetica',
        color: '#64748b',
        alignment: 'center',
      },
      {
        id: 'id_role',
        key: 'role',
        name: 'Role Banner',
        x: 0.15,
        y: 0.69,
        width: 0.70,
        height: 0.07,
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#4338ca',
        alignment: 'center',
      },
      {
        id: 'id_cert_id',
        key: 'certificate_id',
        name: 'Badge ID',
        x: 0.05,
        y: 0.81,
        width: 0.90,
        height: 0.06,
        fontSize: 7,
        fontFamily: 'Courier-Bold',
        color: '#475569',
        alignment: 'center',
      },
    ],
  };

  // 5. Volunteer ID Card
  const volunteerIdCard: DocumentTemplate = {
    id: 'template_volunteer_id_card',
    name: 'Volunteer ID Badge (CR80)',
    type: 'builtin',
    builtinTemplateId: 'id_volunteer',
    format: 'ID_CR80',
    orientation: 'portrait',
    widthPt: idCr80Port.widthPt,
    heightPt: idCr80Port.heightPt,
    backgroundImageDataUrl: createVolunteerIdCardSvg(idCr80Port.widthPt, idCr80Port.heightPt),
    fields: [
      {
        id: 'v_id_event',
        key: 'event_name',
        name: 'Event Name Header',
        x: 0.06,
        y: 0.09,
        width: 0.88,
        height: 0.09,
        fontSize: 9,
        minFontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        alignment: 'center',
        wrapText: true,
      },
      {
        id: 'v_id_name',
        key: 'full_name',
        name: 'Full Name',
        x: 0.05,
        y: 0.52,
        width: 0.90,
        height: 0.10,
        fontSize: 12,
        minFontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#064e3b',
        alignment: 'center',
      },
      {
        id: 'v_id_role_badge',
        key: 'role',
        name: 'Volunteer Tag',
        x: 0.15,
        y: 0.69,
        width: 0.70,
        height: 0.07,
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#059669',
        alignment: 'center',
        isStatic: true,
        staticText: 'OFFICIAL VOLUNTEER',
      },
      {
        id: 'v_id_cert_id',
        key: 'certificate_id',
        name: 'Badge ID',
        x: 0.05,
        y: 0.81,
        width: 0.90,
        height: 0.06,
        fontSize: 7,
        fontFamily: 'Courier-Bold',
        color: '#065f46',
        alignment: 'center',
      },
    ],
  };

  return [participationCert, winnerCert, formalLetter, participantIdCard, volunteerIdCard];
}
