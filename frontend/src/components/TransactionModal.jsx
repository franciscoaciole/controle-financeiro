import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

// Palavras-chave associadas a cada categoria.
// A busca ignora maiúsculas/minúsculas e acentos.
const CATEGORY_KEYWORDS = {
  'Salário': ['salario', 'salário', 'pagamento', 'holerite', 'pix recebido'],
  'Alimentação': ['mercado', 'supermercado', 'ifood', 'restaurante', 'padaria', 'lanche', 'comida', 'almoco', 'almoço', 'jantar'],
  'Transporte': ['uber', '99', 'gasolina', 'combustivel', 'combustível', 'onibus', 'ônibus', 'metro', 'metrô', 'estacionamento'],
  'Moradia': ['aluguel', 'condominio', 'condomínio', 'luz', 'energia', 'agua', 'água', 'internet', 'gas', 'gás'],
  'Saúde': ['farmacia', 'farmácia', 'remedio', 'remédio', 'consulta', 'medico', 'médico', 'plano de saude', 'dentista'],
  'Entretenimento': ['netflix', 'spotify', 'cinema', 'show', 'streaming', 'jogo', 'game'],
  'Lazer': ['viagem', 'passeio', 'bar', 'balada', 'parque'],
};

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function suggestCategory(description, categories) {
  if (!description || description.trim().length < 3) return null;
  const normalizedDesc = normalize(description);

  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched = keywords.some((kw) => normalizedDesc.includes(normalize(kw)));
    if (matched) {
      const found = categories.find(
        (cat) => normalize(cat.name) === normalize(categoryName)
      );
      if (found) return found.id;
    }
  }
  return null;
}

// Data de hoje pelo relógio local (não em UTC), no formato AAAA-MM-DD
function todayLocal() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Estilo único para todos os campos do formulário
const inputClass =
  'w-full bg-panel-strong border border-panel-border rounded-[10px] px-4 py-3 text-[13px] text-text placeholder:text-muted outline-none transition focus:border-accent/60';

function TransactionModal({ isOpen, onClose, onSave, categories, transaction }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [wasSuggested, setWasSuggested] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setDate(transaction.date.split('T')[0]);
      setCategoryId(transaction.categoryId);
      setCategoryTouched(true);
    } else {
      setDescription('');
      setAmount('');
      setDate(todayLocal());
      setCategoryId(categories[0]?.id || '');
      setCategoryTouched(false);
    }
    setWasSuggested(false);
  }, [transaction, categories, isOpen]);

  useEffect(() => {
    if (transaction) return;
    if (categoryTouched) return;

    const suggestedId = suggestCategory(description, categories);
    if (suggestedId) {
      setCategoryId(suggestedId);
      setWasSuggested(true);
    }
  }, [description]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-panel backdrop-blur-xl border border-panel-border rounded-[18px] p-6">
        <div className="flex justify-between items-center gap-2 mb-6">
          <h2 className="font-display text-[17px] font-semibold tracking-tight truncate pr-2">
            {transaction ? 'Editar transação' : 'Nova transação'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-muted">Descrição</span>
            <input
              type="text"
              placeholder="Ex.: Mercado, Uber, Netflix"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-muted">Valor (R$)</span>
            <input
              type="number"
              step="0.01"
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
      </div>
    </div>
  );
}

export default TransactionModal;
