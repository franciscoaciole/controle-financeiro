import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Janela modal acessível, usada por todos os modais do app:
// - role="dialog" + aria-modal: leitores de tela sabem que é uma janela por cima
// - ao abrir, o foco vai para o primeiro campo; ao fechar, volta para quem abriu
// - Tab fica preso dentro do modal; Esc fecha
function Modal({ title, onClose, children, className = 'max-w-md p-6', headerClassName = 'mb-6' }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    const firstField = panel?.querySelector('input:not([type="hidden"]), select, textarea');
    (firstField || panel)?.focus();

    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`w-full bg-panel backdrop-blur-xl border border-panel-border rounded-[18px] outline-none ${className}`}
      >
        <div className={`flex justify-between items-center gap-2 ${headerClassName}`}>
          <h2
            id={titleId}
            className="font-display text-[17px] font-semibold tracking-tight truncate pr-2"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted hover:text-text transition"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
