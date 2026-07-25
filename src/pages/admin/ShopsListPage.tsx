import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Building2, Users, Car, ClipboardList } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Shop } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const shopSchema = z.object({
  name: z.string().min(1, 'Shop name required'),
  slug: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  adminFirstName: z.string().optional(),
  adminLastName: z.string().optional(),
  adminEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  adminPassword: z.string().min(6, 'At least 6 characters').optional().or(z.literal('')),
});

type ShopForm = z.infer<typeof shopSchema>;

function CreateShopModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ShopForm) => api.post('/admin/shops', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      toast.success('Shop created');
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create shop';
      toast.error(msg);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Shop"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={isSubmitting || mutation.isPending} className="btn-primary">
            {isSubmitting || mutation.isPending ? 'Creating...' : 'Create Shop'}
          </button>
        </>
      }
    >
      <form className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shop details</label>
          <div className="grid grid-cols-2 gap-3">
            <input {...register('name')} placeholder="Shop name" className="input col-span-2" />
            <input {...register('address')} placeholder="Address" className="input col-span-2" />
            <input {...register('city')} placeholder="City" className="input" />
            <input {...register('state')} placeholder="State/Province" className="input" />
            <input {...register('zip')} placeholder="Zip/Postal code" className="input" />
            <input {...register('phone')} placeholder="Phone" className="input" />
            <input {...register('email')} placeholder="Shop email" className="input col-span-2" />
          </div>
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            First Shop Admin (optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input {...register('adminFirstName')} placeholder="First name" className="input" />
            <input {...register('adminLastName')} placeholder="Last name" className="input" />
            <input {...register('adminEmail')} placeholder="Admin email" className="input col-span-2" />
            <input {...register('adminPassword')} type="password" placeholder="Temporary password" className="input col-span-2" />
          </div>
          {errors.adminEmail && <p className="mt-1.5 text-xs text-red-500">{errors.adminEmail.message}</p>}
          {errors.adminPassword && <p className="mt-1.5 text-xs text-red-500">{errors.adminPassword.message}</p>}
        </div>
      </form>
    </Modal>
  );
}

export default function ShopsListPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: () => api.get<{ success: boolean; data: Shop[] }>('/admin/shops'),
  });

  const shops = data?.data.data ?? [];

  return (
    <div>
      <PageHeader
        title="Shops"
        description="Every shop on the platform"
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Shop
          </button>
        }
      />

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : shops.length === 0 ? (
        <EmptyState icon={Building2} title="No shops yet" description="Create the first shop to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map(shop => (
            <Link
              key={shop.id}
              to={`/admin/shops/${shop.id}`}
              className="card p-5 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{shop.name}</h3>
                <span className={`badge ${shop.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}>
                  {shop.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {(shop.city || shop.state) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {[shop.city, shop.state].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                    <Users size={13} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{shop._count?.users ?? 0}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Users</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                    <Car size={13} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{shop._count?.vehicles ?? 0}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Vehicles</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                    <ClipboardList size={13} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{shop._count?.repairOrders ?? 0}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Repair Orders</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateShopModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
