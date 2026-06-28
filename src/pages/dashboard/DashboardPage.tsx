import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Wrench, Users, FileText, DollarSign, AlertTriangle, TrendingUp,
  ArrowRight, Clock,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '@/services/api';
import { DashboardStats, RepairOrder } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  ESTIMATE:      '#94a3b8',
  APPROVED:      '#3b82f6',
  IN_PROGRESS:   '#f59e0b',
  WAITING_PARTS: '#f97316',
  QUALITY_CHECK: '#a855f7',
  COMPLETED:     '#22c55e',
  INVOICED:      '#14b8a6',
  CLOSED:        '#64748b',
  CANCELLED:     '#e60000',
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
}

/* ─── KPI Card ─────────────────────────────────────────── */
interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  link?: string;
}

function KpiCard({ title, value, icon: Icon, color, bgColor, link }: KpiCardProps) {
  const content = (
    <div className={`card px-4 py-3 flex items-center gap-3 ${link ? 'hover:border-brand-300 dark:hover:border-brand-700 transition-colors cursor-pointer' : ''}`}>
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
        <Icon size={15} className={color} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 truncate">{title}</p>
        <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
      </div>
      {link && <ArrowRight size={13} className="text-gray-300 dark:text-zinc-600 shrink-0" />}
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : <div>{content}</div>;
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats'),
    refetchInterval: 60000,
  });

  const { data: chartRes } = useQuery({
    queryKey: ['dashboard', 'revenue-chart'],
    queryFn: () => api.get<{ success: boolean; data: { date: string; revenue: number }[] }>('/dashboard/revenue-chart?days=30'),
  });

  const { data: ordersRes, isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: () => api.get<{ success: boolean; data: RepairOrder[] }>('/dashboard/recent-orders'),
  });

  const { data: activityRes } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => api.get('/dashboard/activity'),
    refetchInterval: 30000,
  });

  const stats        = statsRes?.data.data;
  const chartData    = chartRes?.data.data ?? [];
  const recentOrders = ordersRes?.data.data ?? [];
  const activity     = activityRes?.data.data ?? [];

  const statusCount: Record<string, number> = {};
  recentOrders.forEach((ro: RepairOrder) => {
    statusCount[ro.status] = (statusCount[ro.status] ?? 0) + 1;
  });
  const pieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  if (statsLoading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-5">
      {/* Page heading + KPI tiles in one row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="shrink-0">
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <KpiCard
          title="Open Repair Orders"
          value={stats?.openRepairOrders ?? 0}
          icon={Wrench}
          color="text-brand-600"
          bgColor="bg-brand-100 dark:bg-brand-950"
          link="/repair-orders"
        />
        <KpiCard
          title="Vehicles in Shop"
          value={stats?.vehiclesInShop ?? 0}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-950"
        />
        <KpiCard
          title="Pending Estimates"
          value={stats?.pendingEstimates ?? 0}
          icon={FileText}
          color="text-amber-600"
          bgColor="bg-amber-100 dark:bg-amber-950"
          link="/estimates"
        />
        <KpiCard
          title="Today's Revenue"
          value={formatCurrency(stats?.todayRevenue ?? 0)}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100 dark:bg-green-950"
          link="/payments"
        />
        <KpiCard
          title="Overdue ROs"
          value={stats?.overdueRepairOrders ?? 0}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-100 dark:bg-red-950"
          link="/repair-orders"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Revenue — Last 30 Days</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily payment totals</p>
            </div>
            <TrendingUp size={17} className="text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => format(new Date(d), 'MMM d')} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} stroke="#9ca3af" />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} labelFormatter={l => format(new Date(l), 'MMM d, yyyy')} />
              <Line type="monotone" dataKey="revenue" stroke="#e60000" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#e60000' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">RO Status Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={7}
                  formatter={v => <span className="text-[11px] text-gray-600 dark:text-zinc-400">{v.replace(/_/g, ' ')}</span>} />
                <Tooltip formatter={(v, n) => [v, String(n).replace(/_/g, ' ')]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent Repair Orders */}
        <div className="card xl:col-span-2 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Recent Repair Orders</h2>
            <Link to="/repair-orders" className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {ordersLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner /></div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No repair orders yet</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {recentOrders.slice(0, 6).map((ro: RepairOrder) => (
                <Link
                  key={ro.id}
                  to={`/repair-orders/${ro.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center shrink-0">
                      <Wrench size={14} className="text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ro.roNumber}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {ro.customer?.firstName} {ro.customer?.lastName} · {ro.vehicle?.year} {ro.vehicle?.make} {ro.vehicle?.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={ro.status} />
                    {ro.promisedDate && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />
                        {format(new Date(ro.promisedDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-200 dark:border-zinc-800">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Activity Feed</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800 overflow-y-auto max-h-72">
            {activity.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No activity yet</div>
            ) : (
              activity.slice(0, 10).map((item: {
                id: string; message: string; customer: string; by: string; timestamp: string
              }) => (
                <div key={item.id} className="px-5 py-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-snug">{item.message}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {item.customer} · by {item.by} · {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
