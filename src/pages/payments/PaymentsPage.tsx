import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, CreditCard } from 'lucide-react';
import api from '@/services/api';
import { Payment, PaymentMethod } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { format } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  CARD: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  CHECK: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  FINANCING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

interface PaymentWithInvoice extends Payment {
  invoice?: {
    invoiceNumber: string;
    customer?: { firstName: string; lastName: string };
  };
}

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', search, methodFilter, page],
    queryFn: () =>
      api.get(`/payments?search=${search}&method=${methodFilter}&page=${page}&limit=20`),
    placeholderData: prev => prev,
  });

  const payments: PaymentWithInvoice[] = data?.data.data ?? [];
  const pagination = data?.data.pagination;

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="View all recorded payments"
      />

      <div className="card p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9"
              placeholder="Search by invoice # or customer..."
            />
          </div>
          <select
            value={methodFilter}
            onChange={e => { setMethodFilter(e.target.value); setPage(1); }}
            className="input max-w-[160px]"
          >
            <option value="">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="CHECK">Check</option>
            <option value="FINANCING">Financing</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="card p-4">
            <p className="text-xs text-gray-400 mb-1">Total on Page</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</p>
          </div>
          {(['CASH', 'CARD', 'CHECK'] as PaymentMethod[]).map(method => {
            const methodPayments = payments.filter(p => p.method === method);
            const methodTotal = methodPayments.reduce((s, p) => s + p.amount, 0);
            return (
              <div key={method} className="card p-4">
                <p className="text-xs text-gray-400 mb-1">{method}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(methodTotal)}</p>
                <p className="text-xs text-gray-400">{methodPayments.length} payment{methodPayments.length !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            description="Payments are recorded from invoice detail pages"
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Invoice #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Customer</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Method</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Reference</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      {p.invoice ? (
                        <Link to={`/invoices/${p.invoiceId}`} className="text-sm font-semibold text-brand-600 hover:underline">
                          {p.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-700 dark:text-gray-300">
                      {p.invoice?.customer
                        ? `${p.invoice.customer.firstName} ${p.invoice.customer.lastName}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${METHOD_COLORS[p.method]}`}>{p.method}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {p.referenceNumber ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(p.paidAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && (
              <div className="px-6 border-t border-gray-200 dark:border-gray-800">
                <Pagination meta={pagination} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
