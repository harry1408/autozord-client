import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import api from '@/services/api';

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

interface OtpVerifyPanelProps {
  email: string;
  onVerified: () => void;
  // Fires an OTP right away instead of waiting for "Resend code" - used when
  // arriving here from a failed login rather than a fresh signup, where any
  // OTP from the original signup attempt has almost certainly expired.
  autoSendOnMount?: boolean;
}

export default function OtpVerifyPanel({ email, onVerified, autoSendOnMount }: OtpVerifyPanelProps) {
  const [otp, setOtp] = useState('');

  const verifyMutation = useMutation({
    mutationFn: () => api.post('/public/verify-otp', { email, otp }),
    onSuccess: onVerified,
  });

  const resendMutation = useMutation({
    mutationFn: () => api.post('/public/resend-otp', { email }),
  });

  useEffect(() => {
    if (autoSendOnMount) resendMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
