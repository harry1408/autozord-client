import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, CheckCircle2, Mail } from 'lucide-react';
import { clsx } from 'clsx';
import { LogoFull } from '@/components/ui/Logo';
import api from '@/services/api';
import TermsCheckboxField from '@/components/legal/TermsCheckboxField';
import { getRegionPricing } from '@/utils/pricing';
import { COUNTRIES, getCitiesForState, getCountryMeta, getStatesForCountry } from '@/utils/geo';
import { Region } from '@/types';

const signupSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State/Province is required'),
  city: z.string().min(1, 'City is required'),
  zip: z.string().min(1, 'Postal code is required'),
  acceptedTerms: z.boolean().refine(v => v === true, { message: 'You must accept the Terms & Conditions to continue' }),
});

type SignupForm = z.infer<typeof signupSchema>;

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function OtpStep({ email }: { email: string }) {
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: () => api.post('/public/verify-otp', { email, otp }),
    onSuccess: () => setVerified(true),
  });

  const resendMutation = useMutation({
    mutationFn: () => api.post('/public/resend-otp', { email }),
  });

  if (verified) {
    return (
      <div className="text-center">
        <CheckCircle2 size={48} className="mx-auto text-brand-400 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">Email verified</h1>
        <p className="text-zinc-400 text-sm mb-6">
          You can log in now. We're still reviewing your shop's registration and will notify you by email as soon as it's fully verified.
        </p>
        <Link to="/login" className="text-sm text-brand-400 hover:underline">Sign in now</Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Mail size={40} className="mx-auto text-brand-400 mb-4" />
      <h1 className="text-2xl font-black text-white mb-2">Check your email</h1>
      <p className="text-zinc-400 text-sm mb-6">
        We sent a 6-digit code to <span className="text-white">{email}</span>
      </p>

      <input
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className="w-full text-center tracking-[0.5em] text-2xl px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
      />

      {verifyMutation.isError && (
        <p className="text-sm text-red-400 mb-4">{errMsg(verifyMutation.error, 'Invalid code')}</p>
      )}
      {resendMutation.isSuccess && (
        <p className="text-sm text-brand-400 mb-4">A new code has been sent.</p>
      )}

      <button
        onClick={() => verifyMutation.mutate()}
        disabled={otp.length !== 6 || verifyMutation.isPending}
        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mb-3"
      >
        {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
      </button>

      <button
        onClick={() => resendMutation.mutate()}
        disabled={resendMutation.isPending}
        className="text-sm text-zinc-500 hover:text-white transition-colors"
      >
        {resendMutation.isPending ? 'Sending...' : 'Resend code'}
      </button>
    </div>
  );
}

export default function SignupPage() {
  const [planType, setPlanType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  // Detected purely from IP, used only to price the plans below and to
  // default the Country field the first time it loads - the signup
  // endpoint independently re-derives this from the request IP at submit
  // time for pricing, so it can't be spoofed into a cheaper region's price
  // by changing the Country field below.
  const { data: regionRes } = useQuery({
    queryKey: ['detect-region'],
    queryFn: () => api.get<{ success: boolean; data: { country: Region } }>('/public/detect-region'),
    staleTime: Infinity,
  });
  const ipRegion = regionRes?.data.data.country ?? 'CA';
  const pricing = getRegionPricing(ipRegion);
  const yearlySavings = pricing.monthly * 12 - pricing.yearly;

  // Country is user-editable and only drives the address fields below
  // (state/zip options and labels) - it has no effect on the price/currency
  // shown above, which always reflects the visitor's real IP location.
  const selectedCountry = watch('country');
  const selectedState = watch('state');
  const countryMeta = getCountryMeta(selectedCountry);
  const stateOptions = getStatesForCountry(selectedCountry);
  const cityOptions = getCitiesForState(selectedState);

  useEffect(() => {
    if (regionRes) setValue('country', ipRegion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionRes]);

  const mutation = useMutation({
    mutationFn: (data: SignupForm) => api.post('/public/signup', { ...data, planType }),
    onSuccess: (_res, variables) => setSignedUpEmail(variables.email),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <LogoFull className="h-12 w-auto" />
        </div>

        {signedUpEmail ? (
          <OtpStep email={signedUpEmail} />
        ) : (
          <>
            <h1 className="text-2xl font-black text-white mb-1 text-center">Create your shop account</h1>
            <p className="text-zinc-500 text-sm mb-8 text-center">7-day free trial on either plan, no card required today</p>

            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Choose a plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['MONTHLY', 'YEARLY'] as const).map(value => {
                    const isYearly = value === 'YEARLY';
                    const price = isYearly ? pricing.yearly : pricing.monthly;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPlanType(value)}
                        className={clsx(
                          'relative text-left px-4 py-3 rounded-xl border transition-colors',
                          planType === value
                            ? 'border-brand-500 bg-brand-600/10'
                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                        )}
                      >
                        {isYearly && yearlySavings > 0 && (
                          <span className="absolute -top-2 right-3 px-1.5 py-0.5 bg-brand-600 text-white text-[9px] font-bold rounded-full uppercase">
                            Save {pricing.symbol}{yearlySavings.toLocaleString()}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <div className={clsx(
                            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                            planType === value ? 'border-brand-400 bg-brand-500' : 'border-zinc-600'
                          )}>
                            {planType === value && <Check size={10} className="text-white" />}
                          </div>
                          <span className="text-sm font-bold text-white">{isYearly ? 'Yearly' : 'Monthly'}</span>
                        </div>
                        <p className="text-lg font-black text-white">
                          {pricing.symbol}{price.toLocaleString()} <span className="text-xs font-normal text-zinc-500">{pricing.currency}{isYearly ? '/year' : '/month'}</span>
                        </p>
                      </button>
                    );
                  })}
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
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Shop Address (optional)</label>
                <input {...register('address')} placeholder="Street address" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Country</label>
                  <select
                    {...register('country', { onChange: () => setValue('state', '', { shouldValidate: true }) })}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.country && <p className="mt-1.5 text-xs text-red-400">{errors.country.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{countryMeta.stateLabel}</label>
                  <select
                    {...register('state', { onChange: () => setValue('city', '', { shouldValidate: true }) })}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select a {countryMeta.stateLabel.toLowerCase()}</option>
                    {stateOptions.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  {errors.state && <p className="mt-1.5 text-xs text-red-400">{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">City</label>
                  <input
                    {...register('city')}
                    list="signup-city-options"
                    placeholder="e.g. Surrey"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <datalist id="signup-city-options">
                    {cityOptions.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {errors.city && <p className="mt-1.5 text-xs text-red-400">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{countryMeta.zipLabel}</label>
                  <input {...register('zip')} placeholder="e.g. V3X 1R9" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  {errors.zip && <p className="mt-1.5 text-xs text-red-400">{errors.zip.message}</p>}
                </div>
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

              <TermsCheckboxField registration={register('acceptedTerms')} error={errors.acceptedTerms?.message} />

              {mutation.isError && (
                <p className="text-sm text-red-400">{errMsg(mutation.error, 'Signup failed')}</p>
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
            <p className="text-center text-xs text-zinc-600 mt-2">
              Looking for a shop instead? <Link to="/inquiry" className="text-brand-400 hover:underline">Submit a service request</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
