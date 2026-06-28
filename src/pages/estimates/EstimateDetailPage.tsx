import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Send, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Estimate, EstimateStatus, LaborLine, PartsLine } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

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
  estimateId: string;
  labor?: LaborLine;
}

function LaborModal({ open, onClose, estimateId, labor }: LaborModalProps) {
  const qc = useQueryClient();
  const isEdit = !!labor;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LaborForm>({
    resolver: zodResolver(laborSchema),
    defaultValues: labor ?? {},
  });

  const mutation = useMutation({
    mutationFn: (data: LaborForm) =>
      isEdit
        ? api.put(`/estimates/${estimateId}/labor/${labor!.id}`, data)
        : api.post(`/estimates/${estimateId}/labor`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates', estimateId] });
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
          <input {...register('description')} className="input" placeholder="Brake pad replacement" />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Hours *</label>
            <input {...register('hours')} type="number" step="0.1" className="input" placeholder="2.0" />
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
  estimateId: string;
  part?: PartsLine;
}

function PartsModal({ open, onClose, estimateId, part }: PartsModalProps) {
  const qc = useQueryClient();
  const isEdit = !!part;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PartsForm>({
    resolver: zodResolver(partsSchema),
    defaultValues: part ?? {},
  });

  const mutation = useMutation({
    mutationFn: (data: PartsForm) =>
      isEdit
        ? api.put(`/estimates/${estimateId}/parts/${part!.id}`, data)
        : api.post(`/estimates/${estimateId}/parts`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates', estimateId] });
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
            <input {...register('name')} className="input" placeholder="Brake Pads" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Part Number</label>
            <input {...register('partNumber')} className="input" placeholder="BP-5678" />
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
            <input {...register('unitCost')} type="number" step="0.01" className="input" placeholder="35.00" />
          </div>
          <div>
            <label className="label">Sell Price *</label>
            <input {...register('sellingPrice')} type="number" step="0.01" className="input" placeholder="52.00" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [laborModalOpen, setLaborModalOpen] = useState(false);
  const [partsModalOpen, setPartsModalOpen] = useState(false);
  const [editLabor, setEditLabor] = useState<LaborLine | undefined>();
  const [editPart, setEditPart] = useState<PartsLine | undefined>();
  const [deleteItem, setDeleteItem] = useState<{ type: 'labor' | 'parts'; itemId: string } | null>(null);

  const { data: estRes, isLoading } = useQuery({
    queryKey: ['estimates', id],
    queryFn: () => api.get<{ success: boolean; data: Estimate }>(`/estimates/${id}`),
  });

  const statusMutation = useMutation({
    mutationFn: (status: EstimateStatus) => api.patch(`/estimates/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates', id] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const convertMutation = useMutation({
    mutationFn: () => api.post(`/estimates/${id}/convert-to-ro`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates', id] });
      qc.invalidateQueries({ queryKey: ['repair-orders'] });
      toast.success('Converted to repair order');
    },
    onError: () => toast.error('Failed to convert'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ type, itemId }: { type: 'labor' | 'parts'; itemId: string }) =>
      api.delete(`/estimates/${id}/${type}/${itemId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates', id] });
      toast.success('Item removed');
      setDeleteItem(null);
    },
    onError: () => toast.error('Failed to remove item'),
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  const est = estRes?.data.data;
  if (!est) return <div className="card p-8 text-center text-gray-500">Estimate not found</div>;

  const laborTotal = (est.laborLines ?? []).reduce((s, l) => s + l.subtotal, 0);
  const partsTotal = (est.partsLines ?? []).reduce((s, p) => s + p.subtotal, 0);
  const grandTotal = laborTotal + partsTotal;

  return (
    <div className="space-y-6">
      <PageHeader
        title={est.estimateNumber}
        breadcrumbs={[{ label: 'Estimates', to: '/estimates' }, { label: est.estimateNumber }]}
        actions={
          <div className="flex items-center gap-2">
            {est.status === 'DRAFT' && (
              <button onClick={() => statusMutation.mutate('SENT')} disabled={statusMutation.isPending} className="btn-secondary">
                <Send size={15} /> Send
              </button>
            )}
            {(est.status === 'DRAFT' || est.status === 'SENT') && (
              <>
                <button onClick={() => statusMutation.mutate('APPROVED')} disabled={statusMutation.isPending} className="btn-primary">
                  <ThumbsUp size={15} /> Approve
                </button>
                <button onClick={() => statusMutation.mutate('DECLINED')} disabled={statusMutation.isPending} className="btn-danger">
                  <ThumbsDown size={15} /> Decline
                </button>
              </>
            )}
            {est.status === 'APPROVED' && (
              <button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending} className="btn-primary">
                <ArrowRight size={15} /> Convert to RO
              </button>
            )}
          </div>
        }
      />

      {/* Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={est.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Customer</p>
              {est.customer ? (
                <Link to={`/customers/${est.customer.id}`} className="text-brand-600 hover:underline font-medium">
                  {est.customer.firstName} {est.customer.lastName}
                </Link>
              ) : '—'}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Vehicle</p>
              <span className="text-gray-700 dark:text-gray-300">
                {est.vehicleId ? (
                  <Link to={`/vehicles/${est.vehicleId}`} className="text-brand-600 hover:underline">View vehicle</Link>
                ) : '—'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Created</p>
              <p className="text-gray-700 dark:text-gray-300">{format(new Date(est.createdAt), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Expiry</p>
              <p className="text-gray-700 dark:text-gray-300">
                {est.expiryDate ? format(new Date(est.expiryDate), 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          {est.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{est.notes}</p>
            </div>
          )}
        </div>

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
        {(est.laborLines ?? []).length === 0 ? (
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
              {(est.laborLines ?? []).map(l => (
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
        {(est.partsLines ?? []).length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No parts added</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Part</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Price</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subtotal</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(est.partsLines ?? []).map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {p.name}
                    {p.partNumber && <span className="text-xs text-gray-400 ml-2 font-mono">{p.partNumber}</span>}
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{p.quantity}</td>
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

      <LaborModal
        open={laborModalOpen}
        onClose={() => { setLaborModalOpen(false); setEditLabor(undefined); }}
        estimateId={id!}
        labor={editLabor}
      />
      <PartsModal
        open={partsModalOpen}
        onClose={() => { setPartsModalOpen(false); setEditPart(undefined); }}
        estimateId={id!}
        part={editPart}
      />
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
