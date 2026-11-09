import { useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { subscribe } from '../lib/toast';

function Toaster() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    const currentTimers = timers.current;

    function remove(id) {
      clearTimeout(currentTimers.get(id));
      currentTimers.delete(id);
      setToasts((current) => current.filter((t) => t.id !== id));
    }

    const unsubscribe = subscribe((event) => {
      if (event.kind === 'dismiss') {
        remove(event.id);
        return;
      }
      const { toast } = event;
      setToasts((current) => [...current.slice(-2), toast]); // no máximo 3 na tela
      currentTimers.set(toast.id, setTimeout(() => remove(toast.id), toast.duration));
    });

    return () => {
      unsubscribe();
      currentTimers.forEach(clearTimeout);
      currentTimers.clear();
    };
  }, []);

  function dismiss(id) {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }

  return (
    <div
      aria-live="polite"
      className="fixed z-[60] inset-x-4 bottom-24 sm:inset-x-auto sm:right-6 sm:bottom-6 flex flex-col gap-2 sm:w-96 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        return (
          <div
            key={toast.id}
            role={isError ? 'alert' : 'status'}
            className={`toast-enter relative pointer-events-auto flex items-center gap-3 bg-[#141419]/95 backdrop-blur-xl border rounded-[14px] px-4 py-3 shadow-lg ${
              isError ? 'border-neg/40' : 'border-pos/40'
            }`}
          >
            {isError ? (
              <CircleAlert size={17} className="text-neg shrink-0" />
            ) : (
              <CircleCheck size={17} className="text-pos shrink-0" />
            )}
            <p className="text-[13px] text-text flex-1">{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick();
                  dismiss(toast.id);
                }}
                className="text-[12.5px] font-semibold text-accent px-2 py-1 -my-1 rounded-md hover:bg-panel-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 shrink-0"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Fechar aviso"
              className="text-muted hover:text-text transition shrink-0"
            >
              <X size={15} />
            </button>
            {toast.action && (
              // Barra que esvazia: mostra quanto tempo ainda dá para desfazer
              <span
                aria-hidden="true"
                className="toast-timer absolute left-3 right-3 bottom-0 h-[2px] rounded-full bg-accent/50 origin-left"
                style={{ animationDuration: `${toast.duration}ms` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Toaster;
