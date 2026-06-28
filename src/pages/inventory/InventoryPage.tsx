import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, AlertTriangle, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Part, Supplier } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const partSchema = z.object({
  name: z.string().min(1, 'Name required'),
  partNumber: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  unitCost: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  quantityOnHand: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
  supplierId: z.string().optional(),
});

type PartForm = z.infer<typeof partSchema>;

const supplierSchema = z.object({
  name: z.string().min(1, 'Name required'),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
});

type SupplierForm = z.infer<typeof supplierSchema>;

interface PartModalProps {
  open: boolean;
  onClose: () => void;
  part?: Part;
  suppliers: Supplier[];
}

function PartModal({ open, onClose, part, suppliers }: PartModalProps) {
  const qc = useQueryClient();
  const isEdit = !!part;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PartForm>({
    resolver: zodResolver(partSchema),
    defaultValues: part
      ? {
          name: part.name,
          partNumber: part.partNumber ?? '',
          description: part.description ?? '',
          category: part.category ?? '',
          unitCost: part.unitCost,
          sellingPrice: part.sellingPrice,
          quantityOnHand: part.quantityOnHand,
          minStock: part.minStock,
          supplierId: part.supplierId ?? '',
        }
      : { quantityOnHand: 0, minStock: 5, unitCost: 0, sellingPrice: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: PartForm) =>
      isEdit ? api.put(`/inventory/parts/${part!.id}`, data) : api.post('/inventory/parts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts'] });
      toast.success(isEdit ? 'Part updated' : 'Part created');
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
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Part'}
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
        <div>
          <label className="label">Description</label>
          <input {...register('description')} className="input" placeholder="Optional description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <input {...register('category')} className="input" placeholder="Filters, Brakes, etc." />
          </div>
          <div>
            <label className="label">Supplier</label>
            <select {...register('supplierId')} className="input">
              <option value="">No supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Unit Cost *</label>
            <input {...register('unitCost')} type="number" step="0.01" className="input" placeholder="12.50" />
          </div>
          <div>
            <label className="label">Selling Price *</label>
            <input {...register('sellingPrice')} type="number" step="0.01" className="input" placeholder="18.00" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Qty on Hand *</label>
            <input {...register('quantityOnHand')} type="number" className="input" placeholder="0" />
          </div>
          <div>
            <label className="label">Min Stock *</label>
            <input {...register('minStock')} type="number" className="input" placeholder="5" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
}

function SupplierModal({ open, onClose }: SupplierModalProps) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: SupplierForm) => api.post('/inventory/suppliers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier created');
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to create supplier'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Supplier"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : 'Add Supplier'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label">Supplier Name *</label>
          <input {...register('name')} className="input" placeholder="AutoParts Co." />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Person</label>
            <input {...register('contact')} className="input" placeholder="John Doe" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input {...register('phone')} className="input" placeholder="(555) 555-0100" />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email" className="input" placeholder="orders@autoparts.com" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Address</label>
          <input {...register('address')} className="input" placeholder="123 Supplier St" />
        </div>
      </form>
    </Modal>
  );
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'parts' | 'suppliers'>('parts');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<Part | undefined>();
  const [deletePartId, setDeletePartId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: partsData, isLoading: partsLoading } = useQuery({
    queryKey: ['parts', search, lowStockOnly, page],
    queryFn: () =>
      api.get(`/inventory/parts?search=${search}&lowStock=${lowStockOnly}&page=${page}&limit=20`),
    placeholderData: prev => prev,
    enabled: activeTab === 'parts',
  });

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/inventory/suppliers?limit=100'),
    enabled: activeTab === 'suppliers' || partModalOpen,
  });

  const deletePartMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/parts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part deleted');
      setDeletePartId(null);
    },
    onError: () => toast.error('Failed to delete part'),
  });

  const parts: Part[] = partsData?.data.data ?? [];
  const pagination = partsData?.data.pagination;
  const suppliers: Supplier[] = suppliersData?.data.data ?? [];

  const tabs = [
    { id: 'parts' as const, label: 'Parts', icon: Package },
    { id: 'suppliers' as const, label: 'Suppliers', icon: Truck },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage parts and suppliers"
        actions={
          activeTab === 'parts' ? (
            <button onClick={() => { setEditPart(undefined); setPartModalOpen(true); }} className="btn-primary">
              <Plus size={16} /> Add Part
            </button>
          ) : (
            <button onClick={() => setSupplierModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Add Supplier
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Parts Tab */}
      {activeTab === 'parts' && (
        <>
          <div className="card p-4 mb-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="input pl-9"
                  placeholder="Search parts..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={e => { setLowStockOnly(e.target.checked); setPage(1); }}
                  className="rounded"
                />
                <AlertTriangle size={14} className="text-amber-500" />
                Low Stock Only
              </label>
            </div>
          </div>

          <div className="card overflow-hidden">
            {partsLoading ? (
              <LoadingSpinner fullPage />
            ) : parts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No parts found"
                description="Add parts to your inventory"
                action={
                  <button onClick={() => setPartModalOpen(true)} className="btn-primary">
                    <Plus size={16} /> Add Part
                  </button>
                }
              />
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Part</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Category</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Min</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Cost</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sell Price</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {parts.map(part => {
                      const isLowStock = part.quantityOnHand <= part.minStock;
                      return (
                        <tr
                          key={part.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                            isLowStock ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {isLowStock && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{part.name}</p>
                                {part.partNumber && (
                                  <p className="text-xs text-gray-400 font-mono">{part.partNumber}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                            {part.category ?? '—'}
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-semibold ${isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {part.quantityOnHand}
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell text-right text-sm text-gray-500 dark:text-gray-400">
                            {part.minStock}
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-right text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(part.unitCost)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(part.sellingPrice)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setEditPart(part); setPartModalOpen(true); }}
                                className="text-xs text-gray-500 hover:text-brand-600 font-medium px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletePartId(part.id)}
                                className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
        </>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="card overflow-hidden">
          {suppliersLoading ? (
            <LoadingSpinner fullPage />
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No suppliers found"
              description="Add your first supplier"
              action={
                <button onClick={() => setSupplierModalOpen(true)} className="btn-primary">
                  <Plus size={16} /> Add Supplier
                </button>
              }
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Supplier</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.name}</p>
                      {s.address && <p className="text-xs text-gray-400 mt-0.5">{s.address}</p>}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {s.contact ?? '—'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {s.phone ?? '—'}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {s.email ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <PartModal
        open={partModalOpen}
        onClose={() => { setPartModalOpen(false); setEditPart(undefined); }}
        part={editPart}
        suppliers={suppliers}
      />
      <SupplierModal open={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} />
      <ConfirmDialog
        open={!!deletePartId}
        onClose={() => setDeletePartId(null)}
        onConfirm={() => deletePartId && deletePartMutation.mutate(deletePartId)}
        title="Delete Part"
        message="Are you sure you want to delete this part? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deletePartMutation.isPending}
      />
    </div>
  );
}
