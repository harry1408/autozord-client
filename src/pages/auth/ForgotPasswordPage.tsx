import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { LogoFull } from '@/components/ui/Logo';
import api from '@/services/api';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: Form) => api.post('/auth/forgot-password', data),
    onSuccess: () => setSent(true),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <LogoFull className="h-12 w-auto" />
        </div>

        {sent ? (
          <>
            <CheckCircle2 size={44} className="mx-auto text-brand-400 mb-4" />
            <h1 className="text-xl font-black text-white mb-2">Check your email</h1>
            <p className="text-zinc-400 text-sm mb-6">If that account exists, a reset link has been sent.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-black text-white mb-1">Reset your password</h1>
            <p className="text-zinc-500 text-sm mb-8">We'll email you a link to set a new one.</p>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4 text-left">
              <div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {isSubmitting || mutation.isPending ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <Link to="/login" className="block mt-6 text-sm text-brand-400 hover:underline">Back to sign in</Link>
      </div>
    </div>
  );
}
