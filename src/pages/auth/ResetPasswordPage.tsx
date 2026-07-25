import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogoFull } from '@/components/ui/Logo';
import api from '@/services/api';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: Form) => api.post('/auth/reset-password', { token, newPassword: data.password }),
    onSuccess: () => {
      toast.success('Password updated — sign in with your new password');
      navigate('/login');
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6 text-center">
        <div>
          <p className="text-zinc-400 text-sm mb-4">This reset link is missing its token.</p>
          <Link to="/forgot-password" className="text-sm text-brand-400 hover:underline">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <LogoFull className="h-12 w-auto" />
        </div>
        <h1 className="text-xl font-black text-white mb-1 text-center">Set a new password</h1>
        <p className="text-zinc-500 text-sm mb-8 text-center">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">New Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-400">
              {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Reset failed'}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            {isSubmitting || mutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
