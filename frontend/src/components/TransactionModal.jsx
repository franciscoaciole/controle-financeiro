import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function TransactionModal({ isOpen, onClose, onSave, categories, transaction }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setDate(transaction.date.split('T')[0]);
      setCategoryId(transaction.categoryId);
    } else {
      setDescription('');
      setAmount('');
      setDate('');
      setCategoryId(categories[0]?.id || '');
    }
  }, [transaction, categories, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ description, amount: Number(amount), date, categoryId });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
<div className="w-full max-w-md bg-[#14141B] border border-white/10 rounded-2xl p-6">        <div className="flex justify-between items-center gap-2 mb-6">
          <h2 className="text-lg font-semibold text-white truncate pr-2">
            {transaction ? 'Editar transação' :'NovA transação'}
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
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-white/10 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#14141B]">
                {cat.name} ({cat.type === 'INCOME' ? 'Receita' : 'Despesa'})
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg py-3 mt-2 transition"
          >
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}

export default TransactionModal;