import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Invoice, Payment, PaymentMethod } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'CHECK', 'FINANCING', 'OTHER'];

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  method: z.enum(['CASH', 'CARD', 'CHECK', 'FINANCING', 'OTHER']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  CARD: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  CHECK: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  FINANCING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  balance: number;
}

function RecordPaymentModal({ open, onClose, invoiceId, balance }: RecordPaymentModalProps) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: balance, method: 'CASH' },
  });

  const mutation = useMutation({
    mutationFn: (data: PaymentForm) => api.post(`/invoices/${invoiceId}/payments`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices', invoiceId] });
      toast.success('Payment recorded');
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to record payment'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : 'Record Payment'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label">Amount *</label>
          <input {...register('amount')} type="number" step="0.01" className="input" placeholder="0.00" />
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          <p className="mt-1 text-xs text-gray-400">Balance due: {formatCurrency(balance)}</p>
        </div>
        <div>
          <label className="label">Payment Method *</label>
          <select {...register('method')} className="input">
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Reference # (check #, auth code, etc.)</label>
          <input {...register('referenceNumber')} className="input" placeholder="Optional" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Optional notes..." />
        </div>
      </form>
    </Modal>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { data: invRes, isLoading } = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => api.get<{ success: boolean; data: Invoice }>(`/invoices/${id}`),
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  const inv = invRes?.data.data;
  if (!inv) return <div className="card p-8 text-center text-gray-500">Invoice not found</div>;

  const ro = inv.repairOrder;
  const laborLines = ro?.laborLines ?? [];
  const partsLines = ro?.partsLines ?? [];
  const payments: Payment[] = inv.payments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${inv.invoiceNumber}`}
        breadcrumbs={[{ label: 'Invoices', to: '/invoices' }, { label: inv.invoiceNumber }]}
        actions={
          inv.balance > 0 && (
            <button onClick={() => setPaymentModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Record Payment
            </button>
          )
        }
      />

      {/* Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={inv.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Customer</p>
              {inv.customer ? (
                <Link to={`/customers/${inv.customer.id}`} className="text-brand-600 hover:underline font-medium">
                  {inv.customer.firstName} {inv.customer.lastName}
                </Link>
              ) : '—'}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Repair Order</p>
              {ro ? (
                <Link to={`/repair-orders/${ro.id}`} className="text-brand-600 hover:underline font-medium">
                  {ro.roNumber}
                </Link>
              ) : '—'}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Created</p>
              <p className="text-gray-700 dark:text-gray-300">{format(new Date(inv.createdAt), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Due Date</p>
              <p className="text-gray-700 dark:text-gray-300">
                {inv.dueDate ? format(new Date(inv.dueDate), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            {inv.customer?.address && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Billing Address</p>
                <p className="text-gray-700 dark:text-gray-300">{inv.customer.address}</p>
              </div>
            )}
          </div>
          {inv.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{inv.notes}</p>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="card p-6 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span><span>{formatCurrency(inv.subtotal)}</span>
            </div>
            {inv.discount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span><span>-{formatCurrency(inv.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax ({inv.taxRate}%)</span><span>{formatCurrency(inv.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-100 dark:border-gray-800 text-base">
              <span>Total</span><span>{formatCurrency(inv.total)}</span>
            </div>
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Paid</span><span>{formatCurrency(inv.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold text-red-600 dark:text-red-400 pt-1 border-t border-gray-100 dark:border-gray-800">
              <span>Balance</span><span>{formatCurrency(inv.balance)}</span>
            </div>
          </div>
          {inv.balance > 0 && (
            <button onClick={() => setPaymentModalOpen(true)} className="btn-primary w-full mt-2">
              <CreditCard size={15} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Line Items */}
      {laborLines.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Labor</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hours</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rate</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {laborLines.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{l.description}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{l.hours}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{formatCurrency(l.rate)}</td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(l.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {partsLines.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Parts</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Part</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Unit Price</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {partsLines.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {p.name}
                    {p.partNumber && <span className="text-xs text-gray-400 ml-2 font-mono">{p.partNumber}</span>}
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{p.quantity}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(p.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payments</h3>
          {inv.balance > 0 && (
            <button onClick={() => setPaymentModalOpen(true)} className="btn-secondary text-xs">
              <Plus size={14} /> Record Payment
            </button>
          )}
        </div>
        {payments.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No payments recorded</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Method</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Reference</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {format(new Date(p.paidAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`badge ${METHOD_COLORS[p.method]}`}>{p.method}</span>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                    {p.referenceNumber ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoiceId={id!}
        balance={inv.balance}
      />
    </div>
  );
}
