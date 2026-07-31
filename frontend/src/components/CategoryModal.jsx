import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function CategoryModal({ isOpen, onClose, onSave, category }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
    } else {
      setName('');
      setType('EXPENSE');
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name, type });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-[#14141B] border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center gap-2 mb-6">
          <h2 className="text-lg font-semibold text-white">
            {category ? 'Editar categoria' : 'Nova categoria'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome da categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${
                type === 'EXPENSE'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${
                type === 'INCOME'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              Receita
            </button>
          </div>

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

export default CategoryModal;