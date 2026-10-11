import { PDFDocument, rgb } from 'pdf-lib';
import { PAGE_SIZES } from '../types';

export interface ImpositionOptions {
  columns?: number; // default 2
  rows?: number; // default 4 (8 cards per page) or 5 (10 cards per page)
  showCropMarks?: boolean; // default true
  cardMarginPt?: number; // spacing between cards, default 12
}

export interface ImpositionResult {
  pdfBytes: Uint8Array;
  totalPages: number;
  totalCards: number;
  cardsPerPage: number;
}

/**
 * Arranges multiple individual ID card PDFs into printable A4 multi-card sheets.
 * Preserves full vector fidelity using pdf-lib's embedPages without rasterization.
 */
export async function imposeCardsOnA4Sheets(
  cardPdfBytesList: Uint8Array[],
  options: ImpositionOptions = {}
): Promise<ImpositionResult> {
  const {
    columns = 2,
    rows = 4,
    showCropMarks = true,
    cardMarginPt = 12,
  } = options;

  const cardsPerPage = columns * rows;
  const totalCards = cardPdfBytesList.length;

  if (totalCards === 0) {
    throw new Error('No ID card documents provided for sheet imposition.');
  }

  const destPdf = await PDFDocument.create();
  const a4Dim = PAGE_SIZES.A4.portrait;
  const pageWidth = a4Dim.widthPt; // 595.28 pt
  const pageHeight = a4Dim.heightPt; // 841.89 pt

  // Margin around the page
  const pageMarginX = 36; // 0.5 inch (36 pt)
  const pageMarginY = 36; // 0.5 inch (36 pt)

  // Usable area for the grid
  const usableWidth = pageWidth - 2 * pageMarginX;
  const usableHeight = pageHeight - 2 * pageMarginY;

  // Cell dimensions in the grid
  const cellWidth = (usableWidth - (columns - 1) * cardMarginPt) / columns;
  const cellHeight = (usableHeight - (rows - 1) * cardMarginPt) / rows;

  let currentPage = destPdf.addPage([pageWidth, pageHeight]);
  let cardsOnCurrentPage = 0;
  let totalPages = 1;

  for (let i = 0; i < cardPdfBytesList.length; i++) {
    const cardBytes = cardPdfBytesList[i];

    // If current page is full, start a new A4 page
    if (cardsOnCurrentPage >= cardsPerPage) {
      currentPage = destPdf.addPage([pageWidth, pageHeight]);
      cardsOnCurrentPage = 0;
      totalPages++;
    }

    // Determine grid column and row (0-indexed)
    const colIdx = cardsOnCurrentPage % columns;
    const rowIdx = Math.floor(cardsOnCurrentPage / columns);

    // Calculate top-left of cell in UI coordinates
    const cellX = pageMarginX + colIdx * (cellWidth + cardMarginPt);
    // In PDF bottom-up coordinates, row 0 is at the top of the page
    const cellTopY = pageHeight - pageMarginY - rowIdx * (cellHeight + cardMarginPt);
    const cellBottomY = cellTopY - cellHeight;

    try {
      // Load source card and embed first page
      const srcDoc = await PDFDocument.load(cardBytes);
      const [embeddedCard] = await destPdf.embedPages([srcDoc.getPage(0)]);
      const cardOrigWidth = embeddedCard.width;
      const cardOrigHeight = embeddedCard.height;

      // Scale card to fit inside the cell while preserving aspect ratio
      const scaleX = cellWidth / cardOrigWidth;
      const scaleY = cellHeight / cardOrigHeight;
      const scale = Math.min(scaleX, scaleY, 1.0); // Do not upscale beyond original

      const scaledWidth = cardOrigWidth * scale;
      const scaledHeight = cardOrigHeight * scale;

      // Center card inside the cell
      const drawX = cellX + (cellWidth - scaledWidth) / 2;
      const drawY = cellBottomY + (cellHeight - scaledHeight) / 2;

      // Draw embedded vector card
      currentPage.drawPage(embeddedCard, {
        x: drawX,
        y: drawY,
        xScale: scale,
        yScale: scale,
      });

      // Draw subtle crop/cutting outline & guide marks if requested
      if (showCropMarks) {
        // Dotted border around card
        currentPage.drawRectangle({
          x: drawX - 1,
          y: drawY - 1,
          width: scaledWidth + 2,
          height: scaledHeight + 2,
          borderWidth: 0.5,
          borderColor: rgb(0.8, 0.82, 0.85),
          borderDashArray: [3, 3],
        });

        // Corner tick marks (cutting guides)
        const tickLen = 6;
        const tickColor = rgb(0.65, 0.68, 0.72);

        // Top-left corner tick
        currentPage.drawLine({
          start: { x: drawX - tickLen, y: drawY + scaledHeight },
          end: { x: drawX, y: drawY + scaledHeight },
          thickness: 0.5,
          color: tickColor,
        });
        currentPage.drawLine({
          start: { x: drawX, y: drawY + scaledHeight },
          end: { x: drawX, y: drawY + scaledHeight + tickLen },
          thickness: 0.5,
          color: tickColor,
        });

        // Top-right corner tick
        currentPage.drawLine({
          start: { x: drawX + scaledWidth, y: drawY + scaledHeight },
          end: { x: drawX + scaledWidth + tickLen, y: drawY + scaledHeight },
          thickness: 0.5,
          color: tickColor,
        });
        currentPage.drawLine({
          start: { x: drawX + scaledWidth, y: drawY + scaledHeight },
          end: { x: drawX + scaledWidth, y: drawY + scaledHeight + tickLen },
          thickness: 0.5,
          color: tickColor,
        });

        // Bottom-left corner tick
        currentPage.drawLine({
          start: { x: drawX - tickLen, y: drawY },
          end: { x: drawX, y: drawY },
          thickness: 0.5,
          color: tickColor,
        });
        currentPage.drawLine({
          start: { x: drawX, y: drawY - tickLen },
          end: { x: drawX, y: drawY },
          thickness: 0.5,
          color: tickColor,
        });

        // Bottom-right corner tick
        currentPage.drawLine({
          start: { x: drawX + scaledWidth, y: drawY },
          end: { x: drawX + scaledWidth + tickLen, y: drawY },
          thickness: 0.5,
          color: tickColor,
        });
        currentPage.drawLine({
          start: { x: drawX + scaledWidth, y: drawY - tickLen },
          end: { x: drawX, y: drawY },
          thickness: 0.5,
          color: tickColor,
        });
      }
    } catch (err) {
      console.warn(`Failed to embed card #${i + 1} into sheet:`, err);
    }

    cardsOnCurrentPage++;
  }

  // Draw header footnote at top margin on page 1
  try {
    const firstPage = destPdf.getPage(0);
    const font = await destPdf.embedStandardFont('Helvetica' as any);
    firstPage.drawText(
      `EventKit Printable Sheet: ${totalCards} Card(s) on ${totalPages} A4 Page(s) | Cut along dotted lines`,
      {
        x: pageMarginX,
        y: pageHeight - 20,
        size: 7,
        font,
        color: rgb(0.6, 0.63, 0.67),
      }
    );
  } catch {
    // Ignore footnote failure if font embedding encounters edge case
  }

  const pdfBytes = await destPdf.save();

  return {
    pdfBytes,
    totalPages,
    totalCards,
    cardsPerPage,
  };
}
