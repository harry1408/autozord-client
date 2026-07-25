import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inbox, Mail, Phone, Car } from 'lucide-react';
import api from '@/services/api';
import { InquiryShop } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  VIEWED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  RESPONDED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  DECLINED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

function RespondModal({ item, onClose }: { item: InquiryShop; onClose: () => void }) {
  const [response, setResponse] = useState(item.response ?? '');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: string) => api.put(`/inquiries/${item.id}`, { status, response }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries'] });
      toast.success('Inquiry updated');
      onClose();
    },
    onError: () => toast.error('Failed to update inquiry'),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Inquiry from ${item.inquiry.name}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => mutation.mutate('DECLINED')} disabled={mutation.isPending} className="btn-danger">
            Decline
          </button>
          <button onClick={() => mutation.mutate('RESPONDED')} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : 'Send Response'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-gray-900 dark:text-gray-100">{item.inquiry.email}</p>
          </div>
          {item.inquiry.phone && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
              <p className="text-gray-900 dark:text-gray-100">{item.inquiry.phone}</p>
            </div>
          )}
          {item.inquiry.vehicleInfo && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vehicle</p>
              <p className="text-gray-900 dark:text-gray-100">{item.inquiry.vehicleInfo}</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Message</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            {item.inquiry.message}
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Your response
          </label>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            rows={4}
            className="input"
            placeholder="Reply to the customer (send this to them directly via email/phone)"
          />
        </div>
      </div>
    </Modal>
  );
}

export default function InquiriesPage() {
  const [selected, setSelected] = useState<InquiryShop | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: () => api.get<{ success: boolean; data: InquiryShop[] }>('/inquiries'),
  });

  const inquiries = data?.data.data ?? [];

  return (
    <div>
      <PageHeader title="Inquiries" description="Requests submitted through the public shop directory" />

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : inquiries.length === 0 ? (
        <EmptyState icon={Inbox} title="No inquiries yet" description="Public inquiries submitted to your shop will show up here." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map(item => (
                <tr
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30"
                >
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{item.inquiry.name}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5"><Mail size={13} /> {item.inquiry.email}</div>
                    {item.inquiry.phone && <div className="flex items-center gap-1.5 mt-0.5"><Phone size={13} /> {item.inquiry.phone}</div>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                    {item.inquiry.vehicleInfo ? (
                      <div className="flex items-center gap-1.5"><Car size={13} /> {item.inquiry.vehicleInfo}</div>
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
      )}

      {selected && <RespondModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
