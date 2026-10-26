import { useMemo, useState } from 'react';
import { Sparkles, CornerDownLeft } from 'lucide-react';
import { parseQuickEntry } from '../lib/quickEntry';
import { formatCurrency } from '../lib/format';
import { formatISODate } from '../lib/dates';

// Linha única para lançar transações: "uber 25,90 ontem".
// Mostra o que foi entendido antes de salvar, para o usuário conferir.
function QuickEntry({ categories, onCreate }) {
  const [text, setText] = useState('');
  const [chosenCategoryId, setChosenCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const result = useMemo(
    () => (text.trim() ? parseQuickEntry(text, categories) : null),
    [text, categories]
  );
  const entry = result?.ok ? result.entry : null;

  // A escolha manual da categoria sempre vence a sugestão automática
  const categoryId = chosenCategoryId || entry?.categoryId || '';
  const category = categories.find((c) => c.id === categoryId);
  const canSubmit = Boolean(entry && categoryId) && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const saved = await onCreate({
        description: entry.description,
        amount: entry.amount,
        date: entry.date,
        categoryId,
      });
      if (saved) {
        setText('');
        setChosenCategoryId('');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-4 md:p-5 mb-4 md:mb-6"
    >
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <Sparkles size={11} />
          Lançamento rápido
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex.: uber 25,90 ontem · mercado 120 dia 10"
            maxLength={120}
            className="flex-1 min-w-0 bg-panel-strong border border-panel-border rounded-[10px] px-4 py-3 text-[13px] text-text placeholder:text-muted outline-none transition focus:border-accent/60"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Adicionar transação"
            className="flex items-center justify-center gap-1.5 bg-accent text-bg rounded-[10px] px-4 text-[12.5px] font-semibold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CornerDownLeft size={14} />
            <span className="hidden sm:inline">
              {isSubmitting ? 'Salvando...' : 'Adicionar'}
            </span>
          </button>
        </div>
      </label>

      {result && !result.ok && result.reason !== 'empty' && (
        <p className="text-[11.5px] text-muted mt-2.5 px-1">{result.message}</p>
      )}

      {entry && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 px-1 text-[12px]">
          <span className="font-semibold text-text">{entry.description}</span>
          <span
            className={`num font-semibold ${
              category?.type === 'INCOME' ? 'text-pos' : 'text-text'
            }`}
          >
            {category?.type === 'INCOME' ? '+' : '-'}
            {formatCurrency(entry.amount)}
          </span>
          <span className="text-muted">{formatISODate(entry.date)}</span>
          <select
            value={categoryId}
            onChange={(e) => setChosenCategoryId(e.target.value)}
            aria-label="Categoria"
            className="bg-panel-strong border border-panel-border rounded-[8px] px-2.5 py-1.5 text-[12px] text-text outline-none [color-scheme:dark] focus:border-accent/60"
          >
            {!categoryId && <option value="">Escolha a categoria</option>}
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </form>
  );
}

export default QuickEntry;
