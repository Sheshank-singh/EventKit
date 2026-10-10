import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFFont,
  PDFPage,
} from 'pdf-lib';
import {
  DocumentTemplate,
  TemplateField,
  FieldMapping,
  Participant,
  EventMetadata,
  PAGE_SIZES,
} from '../types';
import { resolveFieldValue } from './template-engine';

/**
 * Converts Hex string (#RRGGBB) to pdf-lib rgb() object (0..1).
 */
export function hexToRgb(hex: string) {
  const cleanHex = (hex || '#000000').replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
    return rgb(r, g, b);
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Converts base64 data URI to Uint8Array.
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64Index = dataUrl.indexOf(';base64,');
  const base64 = base64Index >= 0 ? dataUrl.slice(base64Index + 8) : dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Maps standard font name to pdf-lib StandardFonts enum.
 */
function resolveStandardFont(fontFamily: string, isBold?: boolean): StandardFonts {
  if (fontFamily.includes('Times')) {
    return isBold || fontFamily.includes('Bold')
      ? StandardFonts.TimesRomanBold
      : StandardFonts.TimesRoman;
  }
  if (fontFamily.includes('Courier')) {
    return isBold || fontFamily.includes('Bold')
      ? StandardFonts.CourierBold
      : StandardFonts.Courier;
  }
  return isBold || fontFamily.includes('Bold')
    ? StandardFonts.HelveticaBold
    : StandardFonts.Helvetica;
}

/**
 * Word wraps text into lines that fit within maxWidth at a given font size.
 */
export function wrapTextToWidth(
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Calculates PDF coordinates from normalized UI coordinates.
 * Normalized UI coords: (0,0) is top-left of page.
 * PDF coords: (0,0) is bottom-left of page.
 */
export function calculatePdfCoordinates(
  field: TemplateField,
  pageWidth: number,
  pageHeight: number
) {
  const boxX = field.x * pageWidth;
  const boxWidth = Math.max(field.width * pageWidth, 10);
  const boxHeight = Math.max(field.height * pageHeight, 10);

  // In PDF, y=0 is at the bottom.
  // Top of box in PDF coords: pageHeight - (field.y * pageHeight)
  // Bottom of box in PDF coords: pageHeight - ((field.y + field.height) * pageHeight)
  const boxBottomY = pageHeight - ((field.y + field.height) * pageHeight);
  const boxTopY = pageHeight - (field.y * pageHeight);

  return { boxX, boxWidth, boxHeight, boxBottomY, boxTopY };
}

/**
 * Renders a single personalized PDF document using pdf-lib.
 */
export async function renderSingleDocument({
  template,
  mappings,
  participant,
  metadata,
  certificateId,
}: {
  template: DocumentTemplate;
  mappings: FieldMapping[];
  participant: Participant;
  metadata: EventMetadata;
  certificateId: string;
}): Promise<Uint8Array> {
  let pdfDoc: PDFDocument;
  let page: PDFPage;
  let pageWidth = template.widthPt;
  let pageHeight = template.heightPt;

  // Determine page dimensions from format & orientation if not set
  if (!pageWidth || !pageHeight) {
    const dim = PAGE_SIZES[template.format]?.[template.orientation] || PAGE_SIZES.A4.landscape;
    pageWidth = dim.widthPt;
    pageHeight = dim.heightPt;
  }

  if (template.pdfBytesBase64) {
    // Existing PDF template: load without rasterizing
    const existingBytes = dataUrlToUint8Array(template.pdfBytesBase64);
    pdfDoc = await PDFDocument.load(existingBytes);
    page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();
    pageWidth = width;
    pageHeight = height;
  } else {
    // Fresh PDF document
    pdfDoc = await PDFDocument.create();
    page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Draw background image if provided (PNG or JPEG)
    if (
      template.backgroundImageDataUrl &&
      (template.backgroundImageDataUrl.startsWith('data:image/png') ||
        template.backgroundImageDataUrl.startsWith('data:image/jpeg'))
    ) {
      try {
        const bgBytes = dataUrlToUint8Array(template.backgroundImageDataUrl);
        const isPng = template.backgroundImageDataUrl.startsWith('data:image/png');
        const bgImage = isPng
          ? await pdfDoc.embedPng(bgBytes)
          : await pdfDoc.embedJpg(bgBytes);

        page.drawImage(bgImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      } catch (err) {
        console.warn('Could not embed template background image:', err);
      }
    } else {
      // Draw elegant vector borders for canvas templates
      page.drawRectangle({
        x: 20,
        y: 20,
        width: pageWidth - 40,
        height: pageHeight - 40,
        borderWidth: 2,
        borderColor: rgb(0.7, 0.55, 0.2),
      });
      page.drawRectangle({
        x: 24,
        y: 24,
        width: pageWidth - 48,
        height: pageHeight - 48,
        borderWidth: 1,
        borderColor: rgb(0.12, 0.16, 0.23),
      });
    }
  }

  // Pre-load standard fonts
  const fontCache = new Map<string, PDFFont>();
  const getFont = async (fontFamily: string, isBold?: boolean) => {
    const fontEnum = resolveStandardFont(fontFamily, isBold);
    if (!fontCache.has(fontEnum)) {
      const embeddedFont = await pdfDoc.embedFont(fontEnum);
      fontCache.set(fontEnum, embeddedFont);
    }
    return fontCache.get(fontEnum)!;
  };

  // Render each field
  for (const field of template.fields) {
    const mapping = mappings.find(m => m.fieldId === field.id || m.fieldKey === field.key);
    const textValue = resolveFieldValue(field, mapping, participant, metadata, certificateId);

    const { boxX, boxWidth, boxHeight, boxBottomY } = calculatePdfCoordinates(
      field,
      pageWidth,
      pageHeight
    );

    // If field is an embedded logo/signature image
    if (field.isImage && field.imageDataUrl) {
      try {
        const imgBytes = dataUrlToUint8Array(field.imageDataUrl);
        const isPng = field.imageDataUrl.startsWith('data:image/png');
        const embeddedImg = isPng
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        page.drawImage(embeddedImg, {
          x: boxX,
          y: boxBottomY,
          width: boxWidth,
          height: boxHeight,
        });
        continue;
      } catch (err) {
        console.warn(`Failed to embed image field ${field.name}:`, err);
      }
    }

    if (!textValue) continue;

    const font = await getFont(field.fontFamily, field.isBold);
    const minFontSize = field.minFontSize || Math.max(field.fontSize * 0.6, 8);
    let currentFontSize = field.fontSize;
    const textColor = hexToRgb(field.color);

    if (field.wrapText) {
      // Multiline text wrapping
      let lines = wrapTextToWidth(textValue, boxWidth, font, currentFontSize);
      let lineHeight = currentFontSize * 1.25;

      // Shrink font size if all lines do not fit inside bounding box height
      while (lines.length * lineHeight > boxHeight && currentFontSize > minFontSize) {
        currentFontSize -= 1;
        lineHeight = currentFontSize * 1.25;
        lines = wrapTextToWidth(textValue, boxWidth, font, currentFontSize);
      }

      // Draw lines starting from top of bounding box downward
      let currentY = boxBottomY + boxHeight - currentFontSize;
      for (const line of lines) {
        const lineWidth = font.widthOfTextAtSize(line, currentFontSize);
        let drawX = boxX;
        if (field.alignment === 'center') {
          drawX = boxX + (boxWidth - lineWidth) / 2;
        } else if (field.alignment === 'right') {
          drawX = boxX + boxWidth - lineWidth;
        }

        page.drawText(line, {
          x: Math.max(drawX, 0),
          y: currentY,
          size: currentFontSize,
          font,
          color: textColor,
        });

        currentY -= lineHeight;
        if (currentY < boxBottomY) break; // Avoid drawing below box
      }
    } else {
      // Single line text (e.g., Participant Name, Certificate ID, Date)
      let textWidth = font.widthOfTextAtSize(textValue, currentFontSize);

      // Auto-shrink font size to fit width
      while (textWidth > boxWidth && currentFontSize > minFontSize) {
        currentFontSize -= 1;
        textWidth = font.widthOfTextAtSize(textValue, currentFontSize);
      }

      let drawX = boxX;
      if (field.alignment === 'center') {
        drawX = boxX + (boxWidth - textWidth) / 2;
      } else if (field.alignment === 'right') {
        drawX = boxX + boxWidth - textWidth;
      }

      // Vertically center inside box
      const fontHeight = currentFontSize * 0.8;
      const drawY = boxBottomY + (boxHeight - fontHeight) / 2;

      page.drawText(textValue, {
        x: Math.max(drawX, 0),
        y: drawY,
        size: currentFontSize,
        font,
        color: textColor,
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Quick helper to create an Object URL from PDF bytes for immediate preview.
 */
export function createPdfBlobUrl(pdfBytes: Uint8Array): string {
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
