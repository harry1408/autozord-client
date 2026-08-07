import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Mail } from 'lucide-react';
import api from '@/services/api';
import { Invoice, ShopSettings } from '@/types';
import InvoicePrint, { PrintFormData } from '@/components/InvoicePrint';
import EmailInvoiceModal from '@/components/EmailInvoiceModal';
import { captureInvoicePdf } from '@/utils/invoicePdfExport';

interface Props {
  invoiceId: string;
}

// Self-contained "Print Invoice" / "Email Invoice" buttons - fetches the
// invoice + shop settings itself and renders InvoicePrint off-screen, so any
// page can drop this in without re-fetching or duplicating the print/PDF
// pipeline already used on the invoice detail page.
export default function InvoicePrintActions({ invoiceId }: Props) {
  const [printData, setPrintData] = useState<PrintFormData | null>(null);
  const [busy, setBusy] = useState<'print' | null>(null);
  // True only while the email modal's PDF preview is being captured, so
  // InvoicePrint renders with the compact print-equivalent styles (see
  // forPdf on InvoicePrint) instead of the more spacious screen ones.
  const [preparingEmailPdf, setPreparingEmailPdf] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: invRes } = useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: () => api.get<{ success: boolean; data: Invoice }>(`/invoices/${invoiceId}`),
  });
  const { data: shopRes } = useQuery({
    queryKey: ['shop-settings'],
    queryFn: () => api.get<{ success: boolean; data: ShopSettings }>('/settings'),
  });

  const inv = invRes?.data.data;
  const shop = shopRes?.data.data ?? {
    id: '', shopName: 'Autozord', taxRate: 0, laborRate: 85, gstRate: 5, pstRate: 7,
  } as ShopSettings;

  const roTechnicians: any[] = (inv?.repairOrder as any)?.technicians ?? [];
  const firstTech = roTechnicians[0]?.technician?.user;
  const defaultAdvisor = firstTech ? `${firstTech.firstName} ${firstTech.lastName}` : '';
  const defaultMileageOut = inv?.repairOrder?.mileageOut ? String(inv.repairOrder.mileageOut) : '';

  const ensurePrintData = useCallback(async () => {
    if (printData) return;
    setPrintData({
      serviceAdvisor: defaultAdvisor,
      visitType: '',
      mileageOut: defaultMileageOut,
      extrasWithVehicle: '',
    });
    await new Promise(resolve => setTimeout(resolve, 200));
  }, [printData, defaultAdvisor, defaultMileageOut]);

  const handlePrint = async () => {
    if (!inv) return;
    setBusy('print');
    await ensurePrintData();
    window.print();
    setBusy(null);
  };

  const preparePdfForEmail = useCallback(async (): Promise<{ base64: string; blob: Blob }> => {
    setPreparingEmailPdf(true);
    try {
      await ensurePrintData();
      // Let the forPdf-driven re-render (compact print-equivalent styles) commit
      // before capturing, even when ensurePrintData's own delay was skipped
      // because printData was already set from a prior Print click.
      await new Promise(resolve => setTimeout(resolve, 50));
      const node = containerRef.current?.querySelector('#invoice-print') as HTMLElement | null;
      if (!node) throw new Error('Could not render invoice for PDF export');
      return await captureInvoicePdf(node);
    } finally {
      setPreparingEmailPdf(false);
    }
  }, [ensurePrintData]);

  return (
    <>
      <button onClick={handlePrint} disabled={!inv || busy !== null} className="btn-secondary">
        <Printer size={16} /> {busy === 'print' ? 'Preparing...' : 'Print Invoice'}
      </button>
      <button onClick={() => setEmailModalOpen(true)} disabled={!inv} className="btn-secondary">
        <Mail size={16} /> Email Invoice
      </button>

      <div ref={containerRef} style={{ position: 'fixed', left: '-10000px', top: 0 }}>
        {printData && inv && <InvoicePrint invoice={inv} shop={shop} printData={printData} forPdf={preparingEmailPdf} />}
      </div>

      {inv && (
        <EmailInvoiceModal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          invoiceId={invoiceId}
          initialEmail={inv.customer?.email}
          onPreparePdf={preparePdfForEmail}
        />
      )}
    </>
  );
}
