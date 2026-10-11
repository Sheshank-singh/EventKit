import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { imposeCardsOnA4Sheets } from '../lib/sheet-imposer';

// Helper to create mock card PDF bytes
async function createMockCardPdf(name: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // CR80 card dimension: 153 x 243 pt
  const page = pdfDoc.addPage([153, 243]);
  const font = await pdfDoc.embedStandardFont('Helvetica' as any);
  page.drawText(name, { x: 20, y: 120, size: 12, font });
  return await pdfDoc.save();
}

describe('Printable A4 ID Card Grid Imposition Engine', () => {
  it('throws an error if no card PDFs are provided', async () => {
    await expect(imposeCardsOnA4Sheets([])).rejects.toThrow(
      'No ID card documents provided for sheet imposition.'
    );
  });

  it('imposes 8 cards into exactly 1 A4 page using 2x4 layout', async () => {
    const cardBytesList: Uint8Array[] = [];
    for (let i = 1; i <= 8; i++) {
      cardBytesList.push(await createMockCardPdf(`Attendee #${i}`));
    }

    const result = await imposeCardsOnA4Sheets(cardBytesList, {
      columns: 2,
      rows: 4,
      showCropMarks: true,
    });

    expect(result.totalCards).toBe(8);
    expect(result.cardsPerPage).toBe(8);
    expect(result.totalPages).toBe(1);
    expect(result.pdfBytes).toBeDefined();
    expect(result.pdfBytes.length).toBeGreaterThan(1000);

    // Verify loaded PDF has exactly 1 page
    const verifiedPdf = await PDFDocument.load(result.pdfBytes);
    expect(verifiedPdf.getPageCount()).toBe(1);

    const [page] = verifiedPdf.getPages();
    expect(page.getWidth()).toBeCloseTo(595.28, 1);
    expect(page.getHeight()).toBeCloseTo(841.89, 1);
  });

  it('imposes 9 cards into exactly 2 A4 pages using 2x4 layout', async () => {
    const cardBytesList: Uint8Array[] = [];
    for (let i = 1; i <= 9; i++) {
      cardBytesList.push(await createMockCardPdf(`Attendee #${i}`));
    }

    const result = await imposeCardsOnA4Sheets(cardBytesList, {
      columns: 2,
      rows: 4,
      showCropMarks: true,
    });

    expect(result.totalCards).toBe(9);
    expect(result.totalPages).toBe(2);

    const verifiedPdf = await PDFDocument.load(result.pdfBytes);
    expect(verifiedPdf.getPageCount()).toBe(2);
  });

  it('imposes 10 cards into exactly 1 A4 page using 2x5 compact layout', async () => {
    const cardBytesList: Uint8Array[] = [];
    for (let i = 1; i <= 10; i++) {
      cardBytesList.push(await createMockCardPdf(`Attendee #${i}`));
    }

    const result = await imposeCardsOnA4Sheets(cardBytesList, {
      columns: 2,
      rows: 5,
      showCropMarks: false,
    });

    expect(result.totalCards).toBe(10);
    expect(result.cardsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);

    const verifiedPdf = await PDFDocument.load(result.pdfBytes);
    expect(verifiedPdf.getPageCount()).toBe(1);
  });
});
