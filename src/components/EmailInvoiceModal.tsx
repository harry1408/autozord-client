import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const emailSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
type EmailForm = z.infer<typeof emailSchema>;

interface EmailInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  initialEmail?: string;
  onPreparePdf: () => Promise<{ base64: string; blob: Blob }>;
}

export default function EmailInvoiceModal({ open, onClose, invoiceId, initialEmail, onPreparePdf }: EmailInvoiceModalProps) {
  const qc = useQueryClient();
  const [pdf, setPdf] = useState<{ base64: string; url: string } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail ?? '' },
  });

  // Re-sync the field to the customer's current email each time the modal
  // is opened, so re-opening after a previous send shows the right value.
  useEffect(() => {
    if (open) reset({ email: initialEmail ?? '' });
  }, [open, initialEmail, reset]);

  // Generate the PDF preview as soon as the modal opens, so what's shown is
  // exactly what gets sent.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPdf(null);
    setPdfError(null);
    setPdfLoading(true);
    onPreparePdf()
      .then(({ base64, blob }) => {
        if (cancelled) return;
        setPdf({ base64, url: URL.createObjectURL(blob) });
      })
      .catch(() => {
        if (!cancelled) setPdfError('Failed to generate PDF preview');
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, onPreparePdf]);

  // Release the object URL whenever it's replaced or the modal unmounts.
  useEffect(() => {
    return () => {
      if (pdf?.url) URL.revokeObjectURL(pdf.url);
    };
  }, [pdf?.url]);

  const mutation = useMutation({
    mutationFn: (data: EmailForm) => {
      if (!pdf?.base64) throw new Error('PDF is not ready yet');
      return api.post(`/invoices/${invoiceId}/send-email`, { ...data, pdfBase64: pdf.base64 });
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['invoices', invoiceId] });
      toast.success(`Invoice emailed to ${res.data?.data?.email ?? 'customer'}`);
      onClose();
    },
    onError: () => toast.error('Failed to send invoice email'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Email Invoice"
      size="2xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit(d => mutation.mutate(d))}
            disabled={mutation.isPending || pdfLoading || !pdf}
            className="btn-primary"
          >
            {mutation.isPending ? 'Sending...' : 'Send Invoice'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Customer Email *</label>
          <input {...register('email')} type="email" className="input" placeholder="customer@example.com" autoFocus />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          <p className="mt-1 text-xs text-gray-400">Confirm or edit before sending — this will be saved to the customer's record.</p>
        </div>

        <div>
          <label className="label">PDF Preview</label>
          <div
            className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
            style={{ height: '480px' }}
          >
            {pdfLoading && (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Generating PDF preview...</div>
            )}
            {pdfError && (
              <div className="h-full flex items-center justify-center text-sm text-red-500">{pdfError}</div>
            )}
            {pdf && !pdfLoading && (
              <iframe src={pdf.url} title="Invoice PDF preview" className="w-full h-full" />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
