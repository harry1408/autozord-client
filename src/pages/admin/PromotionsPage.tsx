import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Megaphone, Send, Check } from 'lucide-react';
import { clsx } from 'clsx';
import api from '@/services/api';
import { LogoIcon } from '@/components/ui/Logo';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';

type PromoRegion = 'US' | 'CA';

// Kept in sync by hand with the server's copy in
// autozord-server/src/utils/promoEmail.ts, which is what actually gets
// sent - this is only for the on-screen preview.
const GREETING = 'Hi there,';
const HEADLINE = 'Give your shop a system it deserves.';
const INTRO = "Running a repair shop on spreadsheets, sticky notes, and group texts gets harder every month. Autozord brings repair orders, estimates, invoices, inspections, inventory, and your whole team into one place, built specifically for auto repair shops.";
const FEATURES: [string, string][] = [
  ['Job Board & Repair Orders', 'track every vehicle from intake to pickup'],
  ['Estimates & Invoices', 'professional and branded, sent in seconds'],
  ['Digital Vehicle Inspections', 'photos, notes, and one-tap customer approvals'],
  ['Technician Scheduling', 'assign jobs and track hours without a whiteboard'],
  ['Inventory & Parts', 'always know what is in stock'],
  ['Reports & Insights', 'your shop numbers, at a glance'],
];
const CTA_LABEL = 'Start your free 30-day trial';
const CTA_NOTE = 'No credit card required.';

const REGION_COPY: Record<PromoRegion, { subject: string; regionLine: string }> = {
  US: {
    subject: 'Give your shop a system it deserves - try Autozord free for 30 days',
    regionLine: 'Join repair shops across the United States already running their day on Autozord.',
  },
  CA: {
    subject: 'Give your shop a system it deserves - try Autozord free for 30 days',
    regionLine: 'Join repair shops across Canada, from coast to coast, already running their day on Autozord.',
  },
};

export default function PromotionsPage() {
  const [region, setRegion] = useState<PromoRegion>('US');
  const [to, setTo] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/admin/promotions/send', { to, region }),
    onSuccess: () => { toast.success(`Sent to ${to}`); setTo(''); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send email';
      toast.error(msg);
    },
  });

  const copy = REGION_COPY[region];
  const validEmail = /^\S+@\S+\.\S+$/.test(to);

  return (
    <div>
      <PageHeader
        title="Promotions"
        description="Send the trial-offer email straight to a prospective shop"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div>
          <div className="inline-flex items-center gap-1 p-1 mb-4 bg-gray-100 dark:bg-zinc-800 rounded-full">
            {(['US', 'CA'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
                  region === r
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {r === 'US' ? 'United States' : 'Canada'}
              </button>
            ))}
          </div>

          <div className="card p-4 mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Subject:</span> {copy.subject}
            </p>
          </div>

          {/* Fixed-light email render, same as a real inbox, independent of app theme */}
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div style={{ background: '#f4f4f5', padding: '28px 20px' }}>
              <div style={{ maxWidth: 520, margin: '0 auto', background: '#ffffff', borderRadius: 12, overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif', color: '#27272a' }}>
                <div style={{ height: 6, background: '#e60000' }} />
                <div style={{ padding: '26px 32px 6px', textAlign: 'center' }}>
                  <LogoIcon size={40} />
                </div>
                <div style={{ padding: '8px 32px 6px', fontSize: 14, lineHeight: 1.65 }}>
                  <p style={{ margin: '0 0 16px' }}>{GREETING}</p>
                  <h2 style={{ fontSize: 21, margin: '6px 0 10px', lineHeight: 1.25, color: '#18181b', letterSpacing: '-0.01em' }}>{HEADLINE}</h2>
                  <p style={{ margin: '0 0 16px' }}>{INTRO}</p>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: '4px 0 22px' }}>
                    <tbody>
                      {FEATURES.map(([title, detail]) => (
                        <tr key={title}>
                          <td width={22} style={{ verticalAlign: 'top', padding: '7px 0' }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#e60000', marginTop: 6 }} />
                          </td>
                          <td style={{ verticalAlign: 'top', padding: '7px 0', fontSize: 13.5 }}>
                            <b style={{ color: '#18181b' }}>{title}</b> &mdash; {detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ margin: '0 0 16px' }}>{copy.regionLine}</p>
                  <div style={{ textAlign: 'center', margin: '8px 0 8px' }}>
                    <span style={{ display: 'inline-block', padding: '13px 30px', background: '#e60000', color: '#ffffff', fontWeight: 'bold', fontSize: 14, borderRadius: 8 }}>
                      {CTA_LABEL}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 4px', textAlign: 'center', color: '#71717a', fontSize: 12 }}>{CTA_NOTE}</p>
                  <p style={{ margin: '18px 0 0', color: '#3f3f46', fontSize: 13.5 }}>
                    Talk soon,<br />The Autozord Team<br />info@autozord.com
                  </p>
                </div>
                <div style={{ background: '#fafafa', padding: '16px 32px', textAlign: 'center', borderTop: '1px solid #e4e4e7' }}>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#71717a' }}>Autozord &middot; Auto Repair Shop Management</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Heads up: signups currently start on a 7-day trial by default. If you want people who
            reply to this to actually get 30 days, extend their trial manually after they sign up.
          </p>
        </div>

        <div className="card p-5 h-fit lg:sticky lg:top-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
            <Megaphone size={16} className="text-gray-400" /> Send this email
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Sends the {region === 'US' ? 'United States' : 'Canada'} version above to one recipient.
          </p>
          <label className="label">Recipient email</label>
          <input
            type="email"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="owner@theirshop.com"
            className="input mb-4"
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={!validEmail || mutation.isPending}
            className="btn-primary w-full justify-center"
          >
            {mutation.isPending ? (
              'Sending...'
            ) : mutation.isSuccess ? (
              <><Check size={16} /> Sent</>
            ) : (
              <><Send size={16} /> Send email</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
