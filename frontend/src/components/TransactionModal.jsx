import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

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
      setDate(new Date().toISOString().split('T')[0]);
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-[#14141B] border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center gap-2 mb-6">
          <h2 className="text-lg font-semibold text-white truncate pr-2">
            {transaction ? 'Editar transação' : 'Nova transação'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white/10 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <div className="flex flex-col gap-1.5">
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="bg-white/10 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#14141B]">
                  {cat.name} ({cat.type === 'INCOME' ? 'Receita' : 'Despesa'})
                </option>
              ))}
            </select>
            {wasSuggested && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#4ED9A0] px-1">
                <Sparkles size={11} />
                Categoria sugerida automaticamente
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 mt-2 transition"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TransactionModal;