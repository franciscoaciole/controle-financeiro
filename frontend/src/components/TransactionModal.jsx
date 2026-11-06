import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import Modal from './Modal';
import { suggestCategory } from '../lib/categorySuggestion';
import { todayLocal } from '../lib/dates';

// Estilo único para todos os campos do formulário
const inputClass =
  'w-full bg-panel-strong border border-panel-border rounded-[10px] px-4 py-3 text-[13px] text-text placeholder:text-muted outline-none transition focus:border-accent/60';

// O formulário é remontado a cada abertura (key), então o estado inicial
// vem direto das props e não precisa de useEffect para "resetar".
function TransactionModal({ isOpen, ...props }) {
  if (!isOpen) return null;
  return <TransactionForm key={props.transaction?.id ?? 'new'} {...props} />;
}

function TransactionForm({ onClose, onSave, categories, transaction }) {
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [amount, setAmount] = useState(transaction?.amount ?? '');
  const [date, setDate] = useState(
    transaction ? transaction.date.split('T')[0] : todayLocal()
  );
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? categories[0]?.id ?? ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(Boolean(transaction));
  const [wasSuggested, setWasSuggested] = useState(false);

  function handleDescriptionChange(e) {
    const value = e.target.value;
    setDescription(value);
    if (transaction || categoryTouched) return;

    const suggestedId = suggestCategory(value, categories);
    if (suggestedId) {
      setCategoryId(suggestedId);
      setWasSuggested(true);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave({ description, amount: Number(amount), date, categoryId });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCategoryChange(e) {
    setCategoryId(e.target.value);
    setCategoryTouched(true);
    setWasSuggested(false);
  }

  return (
    <Modal title={transaction ? 'Editar transação' : 'Nova transação'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Descrição</span>
          <input
            type="text"
            placeholder="Ex.: Mercado, Uber, Netflix"
            maxLength={100}
            value={description}
            onChange={handleDescriptionChange}
            className={inputClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Valor (R$)</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} [color-scheme:dark]`}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-muted">Categoria</span>
          <select
            value={categoryId}
            onChange={handleCategoryChange}
            className={`${inputClass} [color-scheme:dark]`}
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type === 'INCOME' ? 'Receita' : 'Despesa'})
              </option>
            ))}
          </select>
          {wasSuggested && (
            <span className="flex items-center gap-1.5 text-[11px] text-pos px-1">
              <Sparkles size={11} />
              Categoria sugerida automaticamente
            </span>
          )}
        </label>

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

export default TransactionModal;
