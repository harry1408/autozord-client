import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import api from '@/services/api';
import { EmailLog } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

const CATEGORY_LABELS: Record<string, string> = {
  OTP: 'Signup OTP',
  PASSWORD_RESET: 'Password Reset',
  INVOICE: 'Invoice',
  REGISTRATION: 'Registration',
  ACCOUNT_VERIFIED: 'Account Verified',
  GENERIC: 'Other',
};

const CATEGORY_STYLES: Record<string, string> = {
  OTP: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  PASSWORD_RESET: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  INVOICE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  REGISTRATION: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  ACCOUNT_VERIFIED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  GENERIC: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function EmailLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-email-logs'],
    queryFn: () => api.get<{ success: boolean; data: EmailLog[] }>('/admin/email-logs'),
    refetchInterval: 15000,
  });

  const logs = data?.data.data ?? [];
  const sentCount = logs.filter(l => l.status === 'SENT').length;
  const failedCount = logs.filter(l => l.status === 'FAILED').length;

  return (
    <div>
      <PageHeader title="Email Activity" description="Every email sent through info@autozord.com (most recent 200)" />

      {!isLoading && logs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{logs.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total (recent)</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-black text-green-600 dark:text-green-400">{sentCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-black text-red-600 dark:text-red-400">{failedCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : logs.length === 0 ? (
        <EmptyState icon={Mail} title="No emails sent yet" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">To</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{log.to}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${CATEGORY_STYLES[log.category] ?? CATEGORY_STYLES.GENERIC}`}>
                      {CATEGORY_LABELS[log.category] ?? log.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{log.subject}</td>
                  <td className="px-5 py-3">
                    {log.status === 'SENT' ? (
                      <span className="badge bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">Sent</span>
                    ) : (
                      <span
                        className="badge bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 cursor-help"
                        title={log.errorMessage ?? undefined}
                      >
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
