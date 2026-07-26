import { X } from 'lucide-react';
import { TERMS_SECTIONS, TERMS_LAST_UPDATED } from './termsContent';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TermsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">Terms &amp; Conditions</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={18} className="text-zinc-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-zinc-300 space-y-4">
          <p className="text-xs text-zinc-500">Last updated: {TERMS_LAST_UPDATED}</p>
          {TERMS_SECTIONS.map(s => (
            <div key={s.heading}>
              <h3 className="text-white font-semibold mb-1">{s.heading}</h3>
              <p className="leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
