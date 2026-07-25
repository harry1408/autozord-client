import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { LogoFull } from '@/components/ui/Logo';
import api from '@/services/api';

const PLANS = [
  { value: 'MONTHLY' as const, label: 'Monthly', price: '$50', period: '/month' },
  { value: 'YEARLY' as const, label: 'Yearly', price: '$400', period: '/year', badge: 'Save $200' },
];

const signupSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [planType, setPlanType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: SignupForm) => api.post('/public/signup', { ...data, planType }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6 text-center">
        <div className="max-w-md">
          <CheckCircle2 size={48} className="mx-auto text-brand-400 mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Signup received</h1>
          <p className="text-zinc-400 text-sm mb-6">
            We'll verify your account and email you once you can log in — usually within one business day.
          </p>
          <Link to="/login" className="text-sm text-brand-400 hover:underline">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <LogoFull className="h-12 w-auto" />
        </div>

        <h1 className="text-2xl font-black text-white mb-1 text-center">Create your shop account</h1>
        <p className="text-zinc-500 text-sm mb-8 text-center">7-day free trial on either plan, no card required today</p>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Choose a plan</label>
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map(plan => (
                <button
                  key={plan.value}
                  type="button"
                  onClick={() => setPlanType(plan.value)}
                  className={clsx(
                    'relative text-left px-4 py-3 rounded-xl border transition-colors',
                    planType === plan.value
                      ? 'border-brand-500 bg-brand-600/10'
                      : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                  )}
                >
                  {plan.badge && (
                    <span className="absolute -top-2 right-3 px-1.5 py-0.5 bg-brand-600 text-white text-[9px] font-bold rounded-full uppercase">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <div className={clsx(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                      planType === plan.value ? 'border-brand-400 bg-brand-500' : 'border-zinc-600'
                    )}>
                      {planType === plan.value && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-sm font-bold text-white">{plan.label}</span>
                  </div>
                  <p className="text-lg font-black text-white">
                    {plan.price} <span className="text-xs font-normal text-zinc-500">{plan.period}</span>
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">First Name</label>
              <input {...register('firstName')} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {errors.firstName && <p className="mt-1.5 text-xs text-red-400">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Last Name</label>
              <input {...register('lastName')} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {errors.lastName && <p className="mt-1.5 text-xs text-red-400">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Shop Name</label>
            <input {...register('shopName')} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.shopName && <p className="mt-1.5 text-xs text-red-400">{errors.shopName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
            <input {...register('email')} type="email" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
            <input {...register('password')} type="password" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-400">
              {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Signup failed'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting || mutation.isPending ? 'Submitting...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
