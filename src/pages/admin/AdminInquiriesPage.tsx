import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Inbox, Mail, Phone } from 'lucide-react';
import api from '@/services/api';
import { InquiryShop } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  VIEWED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  RESPONDED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  DECLINED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

export default function AdminInquiriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => api.get<{ success: boolean; data: InquiryShop[] }>('/admin/inquiries'),
  });

  const inquiries = data?.data.data ?? [];

  return (
    <div>
      <PageHeader title="Inquiries" description="Every public inquiry, across every shop" />

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : inquiries.length === 0 ? (
        <EmptyState icon={Inbox} title="No inquiries yet" />
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2.5">
            {inquiries.map(item => (
              <div key={item.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.inquiry.name}</span>
                  <span className={`badge ${STATUS_STYLES[item.status] ?? ''}`}>{item.status}</span>
                </div>
                <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5"><Mail size={13} /> {item.inquiry.email}</div>
                  {item.inquiry.phone && <div className="flex items-center gap-1.5"><Phone size={13} /> {item.inquiry.phone}</div>}
                </div>
                <div className="flex items-center justify-between gap-3 mt-2">
                  {item.shop ? (
                    <Link to={`/admin/shops/${item.shop.id}`} className="text-sm text-brand-600 hover:underline">{item.shop.name}</Link>
                  ) : <span className="text-sm text-gray-500 dark:text-gray-400">—</span>}
                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Shop</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map(item => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{item.inquiry.name}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5"><Mail size={13} /> {item.inquiry.email}</div>
                    {item.inquiry.phone && <div className="flex items-center gap-1.5 mt-0.5"><Phone size={13} /> {item.inquiry.phone}</div>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                    {item.shop ? (
                      <Link to={`/admin/shops/${item.shop.id}`} className="text-brand-600 hover:underline">{item.shop.name}</Link>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${STATUS_STYLES[item.status] ?? ''}`}>{item.status}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
