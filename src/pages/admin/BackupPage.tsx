import { useMutation } from '@tanstack/react-query';
import { DatabaseBackup } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';

interface DumpResult {
  email: string;
  tableCount: number;
  rowCount: number;
  sizeBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupPage() {
  const mutation = useMutation({
    mutationFn: () => api.post<{ success: boolean; data: DumpResult }>('/admin/db-dump', {}),
    onSuccess: (res) => {
      const { email, tableCount, rowCount, sizeBytes } = res.data.data;
      toast.success(`Database dump emailed to ${email} (${tableCount} tables, ${rowCount} rows, ${formatBytes(sizeBytes)})`);
    },
    onError: () => toast.error('Failed to generate and send database dump'),
  });

  return (
    <div>
      <PageHeader title="Database Backup" description="Generate an on-demand database dump and email it" />

      <div className="card p-6 max-w-xl">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <DatabaseBackup size={20} className="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Send Database Dump</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generates a full SQL data dump of the database, emails it as a compressed attachment to{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">autozord.com@gmail.com</span>, and
              deletes it from the server immediately afterward. Nothing is retained on disk.
            </p>
          </div>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-primary mt-5"
        >
          {mutation.isPending ? 'Generating & sending...' : 'Generate & Email Dump'}
        </button>
      </div>
    </div>
  );
}
