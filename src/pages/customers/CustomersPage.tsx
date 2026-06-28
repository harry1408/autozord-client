import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Phone, Mail, Car, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Customer } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  phone: z.string().min(1, 'Phone required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
}

function CustomerFormModal({ open, onClose, customer }: CustomerFormModalProps) {
  const qc = useQueryClient();
  const isEdit = !!customer;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ?? {},
  });

  const mutation = useMutation({
    mutationFn: (data: CustomerForm) =>
      isEdit
        ? api.put(`/customers/${customer!.id}`, data)
        : api.post('/customers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEdit ? 'Customer updated' : 'Customer created');
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to save customer'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Customer' : 'New Customer'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={isSubmitting || mutation.isPending} className="btn-primary">
            {isSubmitting || mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Customer'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input {...register('firstName')} className="input" placeholder="John" />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input {...register('lastName')} className="input" placeholder="Doe" />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone *</label>
            <input {...register('phone')} className="input" placeholder="(555) 555-0100" />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" placeholder="john@example.com" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input {...register('address')} className="input" placeholder="123 Main Street" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">City</label>
            <input {...register('city')} className="input" placeholder="Springfield" />
          </div>
          <div>
            <label className="label">State</label>
            <input {...register('state')} className="input" placeholder="IL" />
          </div>
          <div>
            <label className="label">ZIP</label>
            <input {...register('zip')} className="input" placeholder="62701" />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Any notes about this customer..." />
        </div>
      </form>
    </Modal>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => api.get(`/customers?search=${search}&page=${page}&limit=20`),
    placeholderData: prev => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete customer'),
  });

  const customers: Customer[] = data?.data.data ?? [];
  const pagination = data?.data.pagination;

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer database"
        actions={
          <button onClick={() => { setEditCustomer(undefined); setModalOpen(true); }} className="btn-primary">
            <Plus size={16} /> New Customer
          </button>
        }
      />

      {/* Search */}
      <div className="card p-4 mb-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
            placeholder="Search by name, phone, or email..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={search ? `No customers match "${search}"` : 'Add your first customer to get started'}
            action={
              !search && (
                <button onClick={() => setModalOpen(true)} className="btn-primary">
                  <Plus size={16} /> Add Customer
                </button>
              )
            }
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Location</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vehicles</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ROs</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/customers/${customer.id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-400 shrink-0">
                          {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(customer.createdAt).toLocaleDateString()}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <Phone size={12} className="text-gray-400" /> {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Mail size={12} className="text-gray-400" /> {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {[customer.city, customer.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Car size={14} className="text-gray-400" />
                        {customer._count?.vehicles ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Wrench size={14} className="text-gray-400" />
                        {customer._count?.repairOrders ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditCustomer(customer); setModalOpen(true); }}
                          className="text-xs text-gray-500 hover:text-brand-600 font-medium px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(customer.id)}
                          className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editCustomer}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
