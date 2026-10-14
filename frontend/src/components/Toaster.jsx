import { useEffect, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { subscribe } from '../lib/toast';

function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribe((toast) => {
      setToasts((current) => [...current.slice(-2), toast]); // no máximo 3 na tela
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id));
      }, 4500);
    });
  }, []);

  function dismiss(id) {
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  return (
    <div
      aria-live="polite"
      className="fixed z-[60] inset-x-4 bottom-24 sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-auto flex flex-col gap-2 sm:w-96 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        return (
          <div
            key={toast.id}
            role={isError ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 bg-panel backdrop-blur-xl border rounded-[14px] px-4 py-3 shadow-lg ${
              isError ? 'border-neg/40' : 'border-pos/40'
            }`}
          >
            {isError ? (
              <CircleAlert size={17} className="text-neg mt-0.5 shrink-0" />
            ) : (
              <CircleCheck size={17} className="text-pos mt-0.5 shrink-0" />
            )}
            <p className="text-[13px] text-text flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Fechar aviso"
              className="text-muted hover:text-text transition shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Toaster;
