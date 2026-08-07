import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download } from 'lucide-react';
import api from '@/services/api';
import { Invoice, ShopSettings } from '@/types';
import InvoicePrint, { PrintFormData } from '@/components/InvoicePrint';
import { captureInvoicePdf } from '@/utils/invoicePdfExport';
import toast from 'react-hot-toast';

interface Props {
  invoiceId: string;
}

// Self-contained "Print Invoice" / "Download Invoice" buttons - fetches the
// invoice + shop settings itself and renders InvoicePrint off-screen, so any
// page can drop this in without re-fetching or duplicating the print/PDF
// pipeline already used on the invoice detail page.
export default function InvoicePrintActions({ invoiceId }: Props) {
  const [printData, setPrintData] = useState<PrintFormData | null>(null);
  const [busy, setBusy] = useState<'print' | 'download' | null>(null);
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

  const handleDownload = async () => {
    if (!inv) return;
    setBusy('download');
    try {
      await ensurePrintData();
      // Let the forPdf-driven re-render (compact print-equivalent styles) commit
      // before capturing, even when ensurePrintData's own delay was skipped
      // because printData was already set from a prior Print click.
      await new Promise(resolve => setTimeout(resolve, 50));
      const node = containerRef.current?.querySelector('#invoice-print') as HTMLElement | null;
      if (!node) throw new Error('Could not render invoice for PDF export');
      const { blob } = await captureInvoicePdf(node);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${inv.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate invoice PDF');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button onClick={handlePrint} disabled={!inv || busy !== null} className="btn-secondary">
        <Printer size={16} /> {busy === 'print' ? 'Preparing...' : 'Print Invoice'}
      </button>
      <button onClick={handleDownload} disabled={!inv || busy !== null} className="btn-secondary">
        <Download size={16} /> {busy === 'download' ? 'Generating...' : 'Download Invoice'}
      </button>

      <div ref={containerRef} style={{ position: 'fixed', left: '-10000px', top: 0 }}>
        {printData && inv && <InvoicePrint invoice={inv} shop={shop} printData={printData} forPdf={busy === 'download'} />}
      </div>
    </>
  );
}
