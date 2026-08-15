import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Zap, Check, Wrench } from 'lucide-react';
import { LogoFull } from '@/components/ui/Logo';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import OtpVerifyPanel from '@/components/auth/OtpVerifyPanel';

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

  // Set when login fails specifically because the email was never
  // OTP-verified - lets the user finish verification right here instead of
  // dead-ending on a toast with no path forward.
  const [unverified, setUnverified] = useState<LoginForm | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completeLogin = (res: any) => {
    const loggedInUser = res.data.data.user;
    setTokens(res.data.data.accessToken, loggedInUser, res.data.data.refreshToken);
    toast.success(`Welcome back, ${loggedInUser.firstName}!`);
    const target =
      loggedInUser.role === 'CUSTOMER' ? '/shops' :
      loggedInUser.role === 'GLOBAL_ADMIN' ? '/admin/shops' :
      from;
    navigate(target, { replace: true });
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data);
      completeLogin(res);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      if (msg.toLowerCase().includes('verify your email')) {
        setUnverified(data);
        return;
      }
      toast.error(msg);
    }
  };

  const handleVerified = async () => {
    if (!unverified) return;
    try {
      const res = await api.post('/auth/login', unverified);
      completeLogin(res);
    } catch {
      toast.success('Email verified - please sign in.');
      setUnverified(null);
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
          <a
            href="mailto:info@autozord.com?subject=Autozord%20Demo%20Request"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/20 border border-brand-600/30 mb-6 hover:bg-brand-600/30 transition-colors"
          >
            <Zap size={12} className="text-brand-400" />
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Request a Demo — info@autozord.com</span>
          </a>
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

        {/* Demo CTA */}
        <a
          href="mailto:info@autozord.com?subject=Autozord%20Demo%20Request"
          className="block bg-zinc-900 border border-white/10 rounded-2xl p-5 hover:border-brand-500/40 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Want to see it in action?</p>
              <p className="text-2xl font-black text-white">Request a Demo</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Write to us at <span className="text-brand-400">info@autozord.com</span>
              </p>
            </div>
            <span className="px-3 py-1 bg-brand-600 text-white text-xs font-black rounded-full uppercase tracking-wide">
              DEMO
            </span>
          </div>
        </a>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <LogoFull className="h-12 w-auto" />
        </div>

        <div className="w-full max-w-md">
        {unverified ? (
          <>
            <OtpVerifyPanel email={unverified.email} onVerified={handleVerified} autoSendOnMount />
            <button
              onClick={() => setUnverified(null)}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 mt-6"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:underline">Forgot password?</Link>
              </div>
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

          <p className="text-center text-xs text-zinc-600 mt-6">
            New shop? <Link to="/signup" className="text-brand-400 hover:underline">Create an account</Link>
          </p>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <Link
            to="/inquiry"
            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-700 hover:border-brand-500/50 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <Wrench size={16} className="text-brand-400" />
            Looking for a shop? Submit a Service Request
          </Link>

          {/* Mobile demo note */}
          <div className="lg:hidden mt-6 text-center">
            <a href="mailto:info@autozord.com?subject=Autozord%20Demo%20Request" className="text-xs text-zinc-600">
              <span className="text-white font-bold">Request a Demo</span>
              {' '}· <span className="text-brand-400">info@autozord.com</span>
            </a>
          </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
