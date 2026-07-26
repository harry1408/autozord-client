import { useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import TermsModal from './TermsModal';

interface Props {
  registration: UseFormRegisterReturn;
  error?: string;
}

export default function TermsCheckboxField({ registration, error }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <label className="flex items-start gap-2.5 text-xs text-zinc-400 cursor-pointer">
        <input type="checkbox" {...registration} className="mt-0.5 accent-brand-600" />
        <span>
          I have read and agree to the{' '}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-brand-400 hover:underline font-medium"
          >
            Terms &amp; Conditions
          </button>
          , including that the Shop selected or registered is directly responsible for its own services — not Autozord.
        </span>
      </label>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      <TermsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
