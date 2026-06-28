import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Wrench, Users, Package, DollarSign } from 'lucide-react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format, subDays } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280', '#ec4899'];

interface DateRange {
  startDate: string;
  endDate: string;
}

function useDateRange() {
  const [range, setRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  return { range, setRange };
}

function DateRangePicker({ range, onChange }: { range: DateRange; onChange: (r: DateRange) => void }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div>
        <label className="label text-xs">From</label>
        <input
          type="date"
          value={range.startDate}
          onChange={e => onChange({ ...range, startDate: e.target.value })}
          className="input max-w-[160px]"
        />
      </div>
      <div>
        <label className="label text-xs">To</label>
        <input
          type="date"
          value={range.endDate}
          onChange={e => onChange({ ...range, endDate: e.target.value })}
          className="input max-w-[160px]"
        />
      </div>
    </div>
  );
}

// ─── Revenue Tab ───────────────────────────────────────────────────────────────

function RevenueTab() {
  const { range, setRange } = useDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ['reports-revenue', range],
    queryFn: () =>
      api.get(`/reports/revenue?startDate=${range.startDate}&endDate=${range.endDate}`),
  });

  const report = data?.data.data;
  const total: number = report?.total ?? 0;
  const byMethod: { method: string; amount: number; count: number }[] = report?.byMethod ?? [];
  const payments: { paidAt: string; amount: number; method: string; invoiceNumber?: string; customer?: string }[] = report?.payments ?? [];

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <DateRangePicker range={range} onChange={setRange} />
      </div>

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(total)}</p>
            </div>
            {byMethod.slice(0, 3).map(m => (
              <div key={m.method} className="card p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{m.method}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(m.amount)}</p>
                <p className="text-xs text-gray-400 mt-1">{m.count} payment{m.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>

          {byMethod.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue by Payment Method</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byMethod} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="method" tick={{ fontSize: 12 }} className="fill-gray-500" />
                  <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payments ({payments.length})</h3>
            </div>
            {payments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No payments in this date range</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Method</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {payments.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {format(new Date(p.paidAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                        {p.customer ?? '—'}
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                        {p.method}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Repair Orders Tab ─────────────────────────────────────────────────────────

function RepairOrdersTab() {
  const { range, setRange } = useDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ['reports-ros', range],
    queryFn: () =>
      api.get(`/reports/repair-orders?startDate=${range.startDate}&endDate=${range.endDate}`),
  });

  const report = data?.data.data;
  const total: number = report?.total ?? 0;
  const byStatus: { status: string; count: number }[] = report?.byStatus ?? [];
  const orders: { roNumber: string; status: string; customer?: string; vehicle?: string; createdAt: string }[] = report?.orders ?? [];

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <DateRangePicker range={range} onChange={setRange} />
      </div>
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
                  <Wrench size={20} className="text-brand-600" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total ROs</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
            </div>
          </div>

          {byStatus.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">ROs by Status</h3>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={byStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {byStatus.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Repair Orders ({orders.length})</h3>
            </div>
            {orders.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No repair orders in this date range</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">RO #</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Vehicle</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {orders.map((ro, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3 text-sm font-semibold text-brand-600">{ro.roNumber}</td>
                      <td className="px-6 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{ro.customer ?? '—'}</td>
                      <td className="px-6 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{ro.vehicle ?? '—'}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {ro.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(ro.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Technicians Tab ───────────────────────────────────────────────────────────

function TechniciansTab() {
  const { range, setRange } = useDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ['reports-technicians', range],
    queryFn: () =>
      api.get(`/reports/technicians?startDate=${range.startDate}&endDate=${range.endDate}`),
  });

  const techs: { id: string; name: string; jobsCompleted: number; totalHours: number; revenue: number }[] = data?.data.data ?? [];

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <DateRangePicker range={range} onChange={setRange} />
      </div>
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techs.length === 0 ? (
            <div className="col-span-full card p-8 text-center text-gray-400">No technician data available</div>
          ) : (
            techs.map(tech => (
              <div key={tech.id} className="card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-400">
                    {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{tech.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{tech.jobsCompleted}</p>
                    <p className="text-xs text-gray-400">Jobs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{tech.totalHours.toFixed(1)}</p>
                    <p className="text-xs text-gray-400">Hours</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(tech.revenue)}</p>
                    <p className="text-xs text-gray-400">Revenue</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inventory Tab ─────────────────────────────────────────────────────────────

function InventoryTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-inventory'],
    queryFn: () => api.get('/reports/inventory'),
  });

  const report = data?.data.data;
  const totalParts: number = report?.totalParts ?? 0;
  const totalValue: number = report?.totalValue ?? 0;
  const lowStockParts: { name: string; partNumber?: string; quantityOnHand: number; minStock: number }[] = report?.lowStock ?? [];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                  <Package size={20} className="text-blue-600" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Parts</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalParts}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                  <Package size={20} className="text-amber-600" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{lowStockParts.length}</p>
            </div>
          </div>

          {lowStockParts.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Low Stock Alert</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Part</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">On Hand</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Min Stock</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Shortage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {lowStockParts.map((p, i) => (
                    <tr key={i} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/10">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                        {p.partNumber && <p className="text-xs text-gray-400 font-mono">{p.partNumber}</p>}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-amber-600 dark:text-amber-400">{p.quantityOnHand}</td>
                      <td className="px-6 py-3 text-right text-sm text-gray-500 dark:text-gray-400">{p.minStock}</td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                        {Math.max(0, p.minStock - p.quantityOnHand)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── AR Aging Tab ──────────────────────────────────────────────────────────────

function ARAgingTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-ar-aging'],
    queryFn: () => api.get('/reports/ar-aging'),
  });

  const report = data?.data.data;
  const buckets: { label: string; count: number; amount: number }[] = report?.buckets ?? [
    { label: '0-30 days', count: 0, amount: 0 },
    { label: '31-60 days', count: 0, amount: 0 },
    { label: '61-90 days', count: 0, amount: 0 },
    { label: '90+ days', count: 0, amount: 0 },
  ];
  const details: { invoiceNumber: string; customer: string; total: number; balance: number; daysOld: number; dueDate?: string }[] = report?.details ?? [];
  const totalAR: number = buckets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-1 card p-4">
              <p className="text-xs text-gray-400 mb-1">Total AR</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAR)}</p>
            </div>
            {buckets.map(bucket => (
              <div key={bucket.label} className="card p-4">
                <p className="text-xs text-gray-400 mb-1">{bucket.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(bucket.amount)}</p>
                <p className="text-xs text-gray-400">{bucket.count} invoice{bucket.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Outstanding Invoices</h3>
            </div>
            {details.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No outstanding invoices</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Invoice</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Customer</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Total</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Balance</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Days Old</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {details.map((inv, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${inv.daysOld > 90 ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}
                    >
                      <td className="px-6 py-3 text-sm font-semibold text-brand-600">{inv.invoiceNumber}</td>
                      <td className="px-6 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">{inv.customer}</td>
                      <td className="px-6 py-3 hidden md:table-cell text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(inv.total)}</td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(inv.balance)}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`badge ${
                          inv.daysOld > 90
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : inv.daysOld > 60
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                            : inv.daysOld > 30
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {inv.daysOld}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'repair-orders', label: 'Repair Orders', icon: Wrench },
  { id: 'technicians', label: 'Technicians', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'ar-aging', label: 'AR Aging', icon: DollarSign },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');

  return (
    <div>
      <PageHeader title="Reports" description="Analytics and business insights" />

      {/* Tab Bar */}
      <div className="flex overflow-x-auto gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit max-w-full">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'revenue' && <RevenueTab />}
      {activeTab === 'repair-orders' && <RepairOrdersTab />}
      {activeTab === 'technicians' && <TechniciansTab />}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'ar-aging' && <ARAgingTab />}
    </div>
  );
}
