import { useState } from 'react';
import Modal from './Modal';

// Confirmação no visual do app (substitui o confirm() nativo do navegador)
function ConfirmDialog({ isOpen, ...props }) {
  if (!isOpen) return null;
  return <ConfirmPanel {...props} />;
}

function ConfirmPanel({ title, message, confirmLabel = 'Excluir', onConfirm, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} className="max-w-sm p-6" headerClassName="mb-3">
      <p className="text-[13px] text-muted leading-relaxed">{message}</p>
      <div className="flex gap-2 justify-end mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold text-muted hover:text-text bg-panel-strong border border-panel-border"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold bg-neg text-bg disabled:opacity-60"
        >
          {isSubmitting ? 'Excluindo…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
