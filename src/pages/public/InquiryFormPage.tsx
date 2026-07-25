import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { PublicShop } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const inquirySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  vehicleInfo: z.string().optional(),
  message: z.string().min(1, 'Tell shops what you need'),
});

type InquiryForm = z.infer<typeof inquirySchema>;

export default function InquiryFormPage() {
  const [searchParams] = useSearchParams();
  const preselectedShopId = searchParams.get('shopId');
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>(preselectedShopId ? [preselectedShopId] : []);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['public-shops'],
    queryFn: () => api.get<{ success: boolean; data: PublicShop[] }>('/public/shops'),
  });
  const shops = data?.data.data ?? [];

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
  });

  const mutation = useMutation({
    mutationFn: (data: InquiryForm) => api.post('/public/inquiries', { ...data, shopIds: selectedShopIds }),
    onSuccess: () => setSubmitted(true),
  });

  function toggleShop(id: string) {
    setSelectedShopIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <CheckCircle2 size={48} className="mx-auto text-brand-400 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">Inquiry sent</h1>
        <p className="text-zinc-400 text-sm">
          We've sent your request to {selectedShopIds.length} shop{selectedShopIds.length === 1 ? '' : 's'}.
          They'll reach out to you directly at the email or phone you provided.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-white mb-2">Request a Quote</h1>
      <p className="text-zinc-400 text-sm mb-8">
        Pick one or more shops and describe what you need — no account required.
      </p>

      <form
        onSubmit={handleSubmit(d => mutation.mutate(d))}
        className="space-y-6"
      >
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Shops ({selectedShopIds.length} selected)
          </label>
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shops.map(shop => (
                <label
                  key={shop.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 cursor-pointer hover:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedShopIds.includes(shop.id)}
                    onChange={() => toggleShop(shop.id)}
                    className="accent-brand-600"
                  />
                  {shop.name}
                </label>
              ))}
            </div>
          )}
          {selectedShopIds.length === 0 && (
            <p className="mt-1.5 text-xs text-red-400">Select at least one shop</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Name</label>
            <input {...register('name')} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Phone (optional)</label>
            <input {...register('phone')} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
          <input {...register('email')} type="email" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Vehicle (optional)</label>
          <input {...register('vehicleInfo')} placeholder="e.g. 2019 Toyota Camry" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">What do you need?</label>
          <textarea {...register('message')} rows={4} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          {errors.message && <p className="mt-1.5 text-xs text-red-400">{errors.message.message}</p>}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-400">
            {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit inquiry'}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending || selectedShopIds.length === 0}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting || mutation.isPending ? 'Sending...' : 'Send Inquiry'}
        </button>
      </form>
    </div>
  );
}
