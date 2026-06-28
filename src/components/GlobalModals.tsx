import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuickActionsStore } from '@/store/quickActions.store';
import Modal from '@/components/ui/Modal';
import api from '@/services/api';
import { Customer } from '@/types';
import toast from 'react-hot-toast';

/* ─── Schemas ──────────────────────────────────────────── */
const customerSchema = z.object({
  firstName:  z.string().min(1, 'Required'),
  lastName:   z.string().min(1, 'Required'),
  phone:      z.string().min(1, 'Required'),
  email:      z.string().email('Invalid email').optional().or(z.literal('')),
  address:    z.string().optional(),
  city:       z.string().optional(),
  state:      z.string().optional(),
  zip:        z.string().optional(),
  notes:      z.string().optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

const vehicleSchema = z.object({
  customerId:   z.string().min(1, 'Customer required'),
  make:         z.string().min(1, 'Required'),
  model:        z.string().min(1, 'Required'),
  year:         z.coerce.number().min(1900).max(new Date().getFullYear() + 2),
  vin:          z.string().optional(),
  licensePlate: z.string().optional(),
  color:        z.string().optional(),
  mileage:      z.coerce.number().optional(),
});
type VehicleForm = z.infer<typeof vehicleSchema>;

/* ─── Add Customer Modal ───────────────────────────────── */
function AddCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: CustomerForm) => api.post('/customers', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created');
      reset();
      onClose();
      navigate(`/customers/${res.data.data.id}`);
    },
    onError: () => toast.error('Failed to create customer'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Customer"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit(d => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Saving…' : 'Add Customer'}
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
            <input {...register('lastName')} className="input" placeholder="Smith" />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone *</label>
            <input {...register('phone')} className="input" placeholder="(555) 000-0000" />
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
          <input {...register('address')} className="input" placeholder="123 Main St" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">City</label>
            <input {...register('city')} className="input" placeholder="Calgary" />
          </div>
          <div>
            <label className="label">Province</label>
            <input {...register('state')} className="input" placeholder="AB" />
          </div>
          <div>
            <label className="label">Postal Code</label>
            <input {...register('zip')} className="input" placeholder="T2P 1A1" />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Any notes…" />
        </div>
      </form>
    </Modal>
  );
}

/* ─── Add Vehicle Modal ────────────────────────────────── */
function AddVehicleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
  });
  const selectedCustomerId = watch('customerId');

  const { data: customersData, isFetching } = useQuery({
    queryKey: ['global-customer-search', customerSearch],
    queryFn: () => api.get(`/customers?search=${customerSearch}&limit=8`),
    enabled: customerSearch.length >= 2,
  });

  useEffect(() => {
    setCustomerResults(customersData?.data.data ?? []);
  }, [customersData]);

  const selectedCustomer = customerResults.find(c => c.id === selectedCustomerId);

  const mutation = useMutation({
    mutationFn: (data: VehicleForm) => api.post('/vehicles', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle added');
      reset();
      setCustomerSearch('');
      onClose();
      navigate(`/vehicles/${res.data.data.id}`);
    },
    onError: () => toast.error('Failed to add vehicle'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Vehicle"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit(d => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Saving…' : 'Add Vehicle'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        {/* Customer search */}
        <div>
          <label className="label">Customer *</label>
          {selectedCustomer ? (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">
                  {selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
                <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => { setValue('customerId', ''); setCustomerSearch(''); }}
                className="text-xs text-brand-600 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                className="input"
                placeholder="Search by name or phone…"
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
              />
              {showResults && customerSearch.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                  {isFetching ? (
                    <p className="p-3 text-xs text-gray-400 text-center">Searching…</p>
                  ) : customerResults.length === 0 ? (
                    <p className="p-3 text-xs text-gray-400 text-center">No results</p>
                  ) : (
                    customerResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setValue('customerId', c.id); setShowResults(false); setCustomerSearch(`${c.firstName} ${c.lastName}`); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-white">{c.firstName[0]}{c.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-gray-400">{c.phone}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Year *</label>
            <input {...register('year')} type="number" className="input" placeholder="2020" />
            {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year.message}</p>}
          </div>
          <div>
            <label className="label">Make *</label>
            <input {...register('make')} className="input" placeholder="Toyota" />
            {errors.make && <p className="mt-1 text-xs text-red-500">{errors.make.message}</p>}
          </div>
          <div>
            <label className="label">Model *</label>
            <input {...register('model')} className="input" placeholder="Camry" />
            {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">License Plate</label>
            <input {...register('licensePlate')} className="input" placeholder="ABC 1234" />
          </div>
          <div>
            <label className="label">Color</label>
            <input {...register('color')} className="input" placeholder="White" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">VIN</label>
            <input {...register('vin')} className="input" placeholder="1HGCM82633A004352" />
          </div>
          <div>
            <label className="label">Current Mileage</label>
            <input {...register('mileage')} type="number" className="input" placeholder="50000" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Export ────────────────────────────────────────────── */
export default function GlobalModals() {
  const { addCustomerOpen, addVehicleOpen, setAddCustomerOpen, setAddVehicleOpen } = useQuickActionsStore();
  return (
    <>
      <AddCustomerModal open={addCustomerOpen} onClose={() => setAddCustomerOpen(false)} />
      <AddVehicleModal  open={addVehicleOpen}  onClose={() => setAddVehicleOpen(false)}  />
    </>
  );
}
