import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onPreparePdf: () => Promise<{ base64: string; blob: Blob }>;
}

// Shows the invoice PDF in an iframe inside a modal, rather than a new
// browser tab - opening a separately-created window/tab and navigating it
// to a blob:/data: URI after the PDF finishes generating hits Chrome's
// popup/gesture restrictions (confirmed while building this: window.open()
// with a delayed location assignment, and a synthetic <a target="_blank">
// click, both got silently blocked). An iframe inside a modal we already
// control has no such restriction, and this is the same mechanism already
// used for the "PDF Preview" in the Email Invoice modal.
export default function PdfPreviewModal({ open, onClose, onPreparePdf }: PdfPreviewModalProps) {
  const [pdf, setPdf] = useState<{ url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPdf(null);
    setError(null);
    setLoading(true);
    onPreparePdf()
      .then(({ blob }) => {
        if (cancelled) return;
        setPdf({ url: URL.createObjectURL(blob) });
      })
      .catch(() => {
        if (!cancelled) setError('Failed to generate invoice PDF');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, onPreparePdf]);

  useEffect(() => {
    return () => {
      if (pdf?.url) URL.revokeObjectURL(pdf.url);
    };
  }, [pdf?.url]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invoice PDF"
      size="2xl"
      footer={<button onClick={onClose} className="btn-secondary">Close</button>}
    >
      <div
        className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
        style={{ height: '70vh' }}
      >
        {loading && (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">Generating PDF...</div>
        )}
        {error && (
          <div className="h-full flex items-center justify-center text-sm text-red-500">{error}</div>
        )}
        {pdf && !loading && (
          <iframe src={pdf.url} title="Invoice PDF" className="w-full h-full" />
        )}
      </div>
    </Modal>
  );
}
