import { clsx } from 'clsx';
import { ROStatus, EstimateStatus, InvoiceStatus, ItemStatus } from '@/types';

const RO_STATUS_STYLES: Record<ROStatus, string> = {
  ESTIMATE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  WAITING_PARTS: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  QUALITY_CHECK: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  INVOICED: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  CLOSED: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const ESTIMATE_STATUS_STYLES: Record<EstimateStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  DECLINED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  EXPIRED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  VOID: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const ITEM_STATUS_STYLES: Record<ItemStatus, string> = {
  OK: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  ATTENTION: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

type StatusType = ROStatus | EstimateStatus | InvoiceStatus | ItemStatus;

function getStyle(status: StatusType): string {
  if (status in RO_STATUS_STYLES) return RO_STATUS_STYLES[status as ROStatus];
  if (status in ESTIMATE_STATUS_STYLES) return ESTIMATE_STATUS_STYLES[status as EstimateStatus];
  if (status in INVOICE_STATUS_STYLES) return INVOICE_STATUS_STYLES[status as InvoiceStatus];
  if (status in ITEM_STATUS_STYLES) return ITEM_STATUS_STYLES[status as ItemStatus];
  return 'bg-gray-100 text-gray-700';
}

function formatLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={clsx('badge font-medium', getStyle(status), className)}>
      {formatLabel(status)}
    </span>
  );
}
