import { useState } from 'react';
import Modal from './Modal';

// Formulário remontado a cada abertura (key): estado inicial vem das props.
function CategoryModal({ isOpen, ...props }) {
  if (!isOpen) return null;
  return <CategoryForm key={props.category?.id ?? 'new'} {...props} />;
}

function CategoryForm({ onClose, onSave, category }) {
  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState(category?.type ?? 'EXPENSE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave({ name, type });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={category ? 'Editar categoria' : 'Nova categoria'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Nome</span>
          <input
            type="text"
            placeholder="Ex.: Educação, Pets, Assinaturas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-panel-strong border border-panel-border rounded-[10px] px-4 py-3 text-[13px] text-text placeholder:text-muted outline-none transition focus:border-accent/60"
            required
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Tipo</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 py-3 rounded-[10px] text-[13px] font-medium border transition ${
                type === 'EXPENSE'
                  ? 'bg-neg/15 text-neg border-neg/40'
                  : 'bg-panel-strong text-muted border-panel-border hover:text-text'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex-1 py-3 rounded-[10px] text-[13px] font-medium border transition ${
                type === 'INCOME'
                  ? 'bg-pos/15 text-pos border-pos/40'
                  : 'bg-panel-strong text-muted border-panel-border hover:text-text'
              }`}
            >
              Receita
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent text-bg rounded-[10px] py-3 mt-2 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </Modal>
  );
}

export default CategoryModal;
