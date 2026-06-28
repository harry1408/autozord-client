import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Zap, Check } from 'lucide-react';
import { LogoFull } from '@/components/ui/Logo';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const FEATURES = [
  'Repair Orders & Estimates',
  'Digital Vehicle Inspections',
  'Inventory & Parts tracking',
  'Revenue reports & analytics',
  'Customer & Vehicle profiles',
];

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { setTokens, isAuthenticated } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data);
      setTokens(res.data.data.accessToken, res.data.data.user);
      toast.success(`Welcome back, ${res.data.data.user.firstName}!`);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-black px-12 py-10 border-r border-white/5">
        {/* Logo */}
        <div>
          <LogoFull className="h-14 w-auto" />
        </div>

        {/* Mid content */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/20 border border-brand-600/30 mb-6">
            <Zap size={12} className="text-brand-400" />
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Lifetime Free Access</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-3">
            Your shop,<br />fully managed.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Everything a modern auto repair shop needs — repair orders, estimates, invoices, inspections, and more.
          </p>

          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-600/20 border border-brand-600/40 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-brand-400" />
                </div>
                <span className="text-sm text-zinc-300">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Current plan</p>
              <p className="text-2xl font-black text-white">Lifetime Free</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Regular price: <span className="line-through text-zinc-600">$400 CAD/year</span>
              </p>
            </div>
            <span className="px-3 py-1 bg-brand-600 text-white text-xs font-black rounded-full uppercase tracking-wide">
              FREE
            </span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <LogoFull className="h-12 w-auto" />
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-2xl font-black text-white mb-1">Sign in</h1>
          <p className="text-zinc-500 text-sm mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(o => !o)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-900/40 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Demo accounts</p>
            <div className="space-y-2">
              {[
                { role: 'Admin',        email: 'admin@autoshop360.com',   pass: 'Admin@123'   },
                { role: 'Manager',      email: 'manager@autoshop360.com', pass: 'Manager@123' },
                { role: 'Technician',   email: 'mike.tech@autoshop360.com', pass: 'Tech@123'  },
              ].map(a => (
                <div key={a.role} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-500 w-20 shrink-0">{a.role}</span>
                  <code className="text-zinc-300 font-mono truncate">{a.email}</code>
                  <code className="text-brand-400 font-mono shrink-0">{a.pass}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile pricing note */}
          <div className="lg:hidden mt-6 text-center">
            <span className="text-xs text-zinc-600">
              <span className="text-white font-bold">Lifetime Free</span>
              {' '}· Regular: <span className="line-through text-zinc-700">$400 CAD/yr</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
