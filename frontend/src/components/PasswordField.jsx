import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const inputClass =
  'w-full bg-panel-strong border border-panel-border rounded-[10px] pl-4 pr-11 py-3 text-base sm:text-[13px] text-text placeholder:text-muted outline-none transition focus:border-accent/60';

function PasswordField({
  label = 'Senha',
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] text-muted">{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          minLength={minLength}
          className={inputClass}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export default PasswordField;
