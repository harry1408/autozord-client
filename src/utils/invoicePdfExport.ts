import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Renders the same DOM node used for window.print() (InvoicePrint) into an
// actual PDF file, so the emailed attachment is pixel-identical to the
// print view instead of a separately hand-drawn server-side layout. Returns
// both a base64 string (for upload) and a Blob (for an in-browser preview)
// from the same render, so what's previewed is exactly what gets sent.
export async function captureInvoicePdf(node: HTMLElement): Promise<{ base64: string; blob: Blob }> {
  const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  // JPEG instead of PNG: a rasterized page compresses far better as JPEG
  // (PNG was producing ~10MB files - over Express's body limit and close to
  // email attachment limits - for a single-page invoice).
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Scale the whole capture to fit on a single page (the print view is
  // designed as one page - it even prints "1 of 1"). Slicing a tall image
  // across multiple pages by shifting it up cuts table rows in half
  // wherever the page break lands, which is worse than shrinking to fit.
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;
  const x = (pageWidth - imgWidth) / 2;

  pdf.addImage(imgData, 'JPEG', x, 0, imgWidth, imgHeight);

  const dataUri = pdf.output('datauristring');
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const blob = pdf.output('blob');
  return { base64, blob };
}
