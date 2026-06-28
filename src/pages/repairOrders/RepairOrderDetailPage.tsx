import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, FileText, UserCheck, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { RepairOrder, ROStatus, Technician, LaborLine, PartsLine } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const RO_TRANSITIONS: Record<ROStatus, ROStatus[]> = {
  ESTIMATE: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'QUALITY_CHECK', 'COMPLETED'],
  WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  QUALITY_CHECK: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: ['INVOICED', 'CLOSED'],
  INVOICED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

const laborSchema = z.object({
  description: z.string().min(1, 'Description required'),
  hours: z.coerce.number().min(0.1),
  rate: z.coerce.number().min(0),
});

const partsSchema = z.object({
  name: z.string().min(1, 'Name required'),
  partNumber: z.string().optional(),
  quantity: z.coerce.number().min(1),
  unitCost: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
});

type LaborForm = z.infer<typeof laborSchema>;
type PartsForm = z.infer<typeof partsSchema>;

interface LaborModalProps {
  open: boolean;
  onClose: () => void;
  roId: string;
  labor?: LaborLine;
}

function LaborModal({ open, onClose, roId, labor }: LaborModalProps) {
  const qc = useQueryClient();
  const isEdit = !!labor;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LaborForm>({
    resolver: zodResolver(laborSchema),
    defaultValues: labor ?? {},
  });

  const mutation = useMutation({
    mutationFn: (data: LaborForm) =>
      isEdit
        ? api.put(`/repair-orders/${roId}/labor/${labor!.id}`, data)
        : api.post(`/repair-orders/${roId}/labor`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-orders', roId] });
      toast.success(isEdit ? 'Labor updated' : 'Labor added');
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to save labor line'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Labor' : 'Add Labor'}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label">Description *</label>
          <input {...register('description')} className="input" placeholder="Oil change and filter" />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Hours *</label>
            <input {...register('hours')} type="number" step="0.1" className="input" placeholder="1.5" />
            {errors.hours && <p className="mt-1 text-xs text-red-500">{errors.hours.message}</p>}
          </div>
          <div>
            <label className="label">Rate ($/hr) *</label>
            <input {...register('rate')} type="number" step="0.01" className="input" placeholder="95.00" />
            {errors.rate && <p className="mt-1 text-xs text-red-500">{errors.rate.message}</p>}
          </div>
        </div>
      </form>
    </Modal>
  );
}

interface PartsModalProps {
  open: boolean;
  onClose: () => void;
  roId: string;
  part?: PartsLine;
}

function PartsModal({ open, onClose, roId, part }: PartsModalProps) {
  const qc = useQueryClient();
  const isEdit = !!part;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PartsForm>({
    resolver: zodResolver(partsSchema),
    defaultValues: part ?? {},
  });

  const mutation = useMutation({
    mutationFn: (data: PartsForm) =>
      isEdit
        ? api.put(`/repair-orders/${roId}/parts/${part!.id}`, data)
        : api.post(`/repair-orders/${roId}/parts`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-orders', roId] });
      toast.success(isEdit ? 'Part updated' : 'Part added');
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to save part'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Part' : 'Add Part'}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Part Name *</label>
            <input {...register('name')} className="input" placeholder="Oil Filter" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Part Number</label>
            <input {...register('partNumber')} className="input" placeholder="PF-1234" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Qty *</label>
            <input {...register('quantity')} type="number" className="input" placeholder="1" />
            {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="label">Cost *</label>
            <input {...register('unitCost')} type="number" step="0.01" className="input" placeholder="12.50" />
            {errors.unitCost && <p className="mt-1 text-xs text-red-500">{errors.unitCost.message}</p>}
          </div>
          <div>
            <label className="label">Sell Price *</label>
            <input {...register('sellingPrice')} type="number" step="0.01" className="input" placeholder="18.00" />
            {errors.sellingPrice && <p className="mt-1 text-xs text-red-500">{errors.sellingPrice.message}</p>}
          </div>
        </div>
      </form>
    </Modal>
  );
}

interface AssignTechModalProps {
  open: boolean;
  onClose: () => void;
  roId: string;
}

function AssignTechModal({ open, onClose, roId }: AssignTechModalProps) {
  const qc = useQueryClient();
  const [selectedTechId, setSelectedTechId] = useState('');

  const { data: techsRes } = useQuery({
    queryKey: ['technicians-active'],
    queryFn: () => api.get('/technicians?isActive=true&limit=100'),
    enabled: open,
  });

  const techs: Technician[] = techsRes?.data.data ?? [];

  const mutation = useMutation({
    mutationFn: () => api.post(`/repair-orders/${roId}/technicians`, { technicianId: selectedTechId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-orders', roId] });
      toast.success('Technician assigned');
      setSelectedTechId('');
      onClose();
    },
    onError: () => toast.error('Failed to assign technician'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Technician"
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!selectedTechId || mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Assigning...' : 'Assign'}
          </button>
        </>
      }
    >
      <div>
        <label className="label">Technician</label>
        <select value={selectedTechId} onChange={e => setSelectedTechId(e.target.value)} className="input">
          <option value="">Select technician</option>
          {techs.map(t => (
            <option key={t.id} value={t.id}>
              {t.user.firstName} {t.user.lastName}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  );
}

export default function RepairOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [laborModalOpen, setLaborModalOpen] = useState(false);
  const [partsModalOpen, setPartsModalOpen] = useState(false);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [editLabor, setEditLabor] = useState<LaborLine | undefined>();
  const [editPart, setEditPart] = useState<PartsLine | undefined>();
  const [deleteItem, setDeleteItem] = useState<{ type: 'labor' | 'parts'; itemId: string } | null>(null);

  const { data: roRes, isLoading } = useQuery({
    queryKey: ['repair-orders', id],
    queryFn: () => api.get<{ success: boolean; data: RepairOrder }>(`/repair-orders/${id}`),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: ROStatus) =>
      api.patch(`/repair-orders/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-orders', id] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ type, itemId }: { type: 'labor' | 'parts'; itemId: string }) =>
      api.delete(`/repair-orders/${id}/${type}/${itemId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-orders', id] });
      toast.success('Item removed');
      setDeleteItem(null);
    },
    onError: () => toast.error('Failed to remove item'),
  });

  const removeTechMutation = useMutation({
    mutationFn: (techId: string) => api.delete(`/repair-orders/${id}/technicians/${techId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repair-orders', id] });
      toast.success('Technician removed');
    },
    onError: () => toast.error('Failed to remove technician'),
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  const ro = roRes?.data.data;
  if (!ro) return <div className="card p-8 text-center text-gray-500">Repair order not found</div>;

  const laborTotal = (ro.laborLines ?? []).reduce((s, l) => s + l.subtotal, 0);
  const partsTotal = (ro.partsLines ?? []).reduce((s, p) => s + p.subtotal, 0);
  const grandTotal = laborTotal + partsTotal;
  const availableTransitions = RO_TRANSITIONS[ro.status] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={ro.roNumber}
        breadcrumbs={[{ label: 'Repair Orders', to: '/repair-orders' }, { label: ro.roNumber }]}
        actions={
          <div className="flex items-center gap-3">
            {availableTransitions.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="input"
                  onChange={e => e.target.value && statusMutation.mutate(e.target.value as ROStatus)}
                  value=""
                  disabled={statusMutation.isPending}
                >
                  <option value="">Change Status...</option>
                  {availableTransitions.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            )}
            <button onClick={() => setTechModalOpen(true)} className="btn-secondary">
              <UserCheck size={16} /> Assign Tech
            </button>
            {ro.invoice && (
              <Link to={`/invoices/${ro.invoice.id}`} className="btn-secondary">
                <FileText size={16} /> Invoice #{ro.invoice.invoiceNumber}
              </Link>
            )}
          </div>
        }
      />

      {/* Status + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={ro.status} />
            {ro.invoice && <StatusBadge status={ro.invoice.status} />}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Customer</p>
              {ro.customer ? (
                <Link to={`/customers/${ro.customer.id}`} className="text-brand-600 hover:underline font-medium">
                  {ro.customer.firstName} {ro.customer.lastName}
                </Link>
              ) : '—'}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Vehicle</p>
              {ro.vehicle ? (
                <Link to={`/vehicles/${ro.vehicle.id}`} className="text-brand-600 hover:underline font-medium">
                  {ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}
                </Link>
              ) : '—'}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Created</p>
              <p className="text-gray-700 dark:text-gray-300">{format(new Date(ro.createdAt), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Promised</p>
              <p className="text-gray-700 dark:text-gray-300">
                {ro.promisedDate ? format(new Date(ro.promisedDate), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Mileage In</p>
              <p className="text-gray-700 dark:text-gray-300">
                {ro.mileageIn != null ? ro.mileageIn.toLocaleString() + ' mi' : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Mileage Out</p>
              <p className="text-gray-700 dark:text-gray-300">
                {ro.mileageOut != null ? ro.mileageOut.toLocaleString() + ' mi' : '—'}
              </p>
            </div>
          </div>
          {(ro.customerNotes || ro.internalNotes) && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              {ro.customerNotes && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Customer Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ro.customerNotes}</p>
                </div>
              )}
              {ro.internalNotes && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Internal Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ro.internalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="card p-6 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Totals</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Labor</span><span>{formatCurrency(laborTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Parts</span><span>{formatCurrency(partsTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span>Total</span><span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Labor Lines */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Labor Lines</h3>
          <button onClick={() => { setEditLabor(undefined); setLaborModalOpen(true); }} className="btn-secondary text-xs">
            <Plus size={14} /> Add Labor
          </button>
        </div>
        {(ro.laborLines ?? []).length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No labor lines added</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hours</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rate</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subtotal</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(ro.laborLines ?? []).map(l => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{l.description}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{l.hours}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{formatCurrency(l.rate)}</td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(l.subtotal)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditLabor(l); setLaborModalOpen(true); }} className="text-xs text-gray-400 hover:text-brand-600 px-1">Edit</button>
                      <button onClick={() => setDeleteItem({ type: 'labor', itemId: l.id })} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Parts Lines */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Parts Lines</h3>
          <button onClick={() => { setEditPart(undefined); setPartsModalOpen(true); }} className="btn-secondary text-xs">
            <Plus size={14} /> Add Part
          </button>
        </div>
        {(ro.partsLines ?? []).length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No parts added</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Part</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Part #</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Cost</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Price</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subtotal</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(ro.partsLines ?? []).map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{p.name}</td>
                  <td className="px-6 py-3 text-sm hidden md:table-cell text-gray-500 dark:text-gray-400 font-mono">{p.partNumber ?? '—'}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{p.quantity}</td>
                  <td className="px-6 py-3 text-sm text-right hidden lg:table-cell text-gray-600 dark:text-gray-400">{formatCurrency(p.unitCost)}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{formatCurrency(p.subtotal)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditPart(p); setPartsModalOpen(true); }} className="text-xs text-gray-400 hover:text-brand-600 px-1">Edit</button>
                      <button onClick={() => setDeleteItem({ type: 'parts', itemId: p.id })} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assigned Technicians */}
      {(ro.technicians ?? []).length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Assigned Technicians</h3>
          <div className="flex flex-wrap gap-3">
            {(ro.technicians ?? []).map(t => (
              <div key={t.technician.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-400">
                  {t.technician.user.firstName[0]}{t.technician.user.lastName[0]}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t.technician.user.firstName} {t.technician.user.lastName}
                </span>
                <button
                  onClick={() => removeTechMutation.mutate(t.technician.id)}
                  className="text-gray-400 hover:text-red-500 p-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status History */}
      {(ro.statusHistory ?? []).length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Status History</h3>
          <div className="space-y-3">
            {(ro.statusHistory ?? []).map(h => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.fromStatus && (
                      <>
                        <StatusBadge status={h.fromStatus as ROStatus} />
                        <ChevronRight size={14} className="text-gray-400" />
                      </>
                    )}
                    <StatusBadge status={h.toStatus as ROStatus} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {h.changedBy.firstName} {h.changedBy.lastName} &middot; {format(new Date(h.changedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                  {h.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <LaborModal
        open={laborModalOpen}
        onClose={() => { setLaborModalOpen(false); setEditLabor(undefined); }}
        roId={id!}
        labor={editLabor}
      />
      <PartsModal
        open={partsModalOpen}
        onClose={() => { setPartsModalOpen(false); setEditPart(undefined); }}
        roId={id!}
        part={editPart}
      />
      <AssignTechModal open={techModalOpen} onClose={() => setTechModalOpen(false)} roId={id!} />
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && deleteItemMutation.mutate(deleteItem)}
        title="Remove Item"
        message="Are you sure you want to remove this line item?"
        confirmLabel="Remove"
        isLoading={deleteItemMutation.isPending}
      />
    </div>
  );
}
