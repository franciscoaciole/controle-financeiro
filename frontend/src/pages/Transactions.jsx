import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ShoppingCart, Car, Home, Utensils, HeartPulse, Tv, Wallet } from 'lucide-react';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactions';
import { getCategories } from '../services/categories';
import TransactionModal from '../components/TransactionModal';

function getCategoryIcon(name) {
  const map = {
    Salário: Wallet,
    Alimentação: Utensils,
    Transporte: Car,
    Moradia: Home,
    Saúde: HeartPulse,
    Entretenimento: Tv,
  };
  return map[name] || ShoppingCart;
}

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState('ALL');

  async function loadData() {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditingTransaction(null);
    setModalOpen(true);
  }

  function openEditModal(transaction) {
    setEditingTransaction(transaction);
    setModalOpen(true);
  }

  async function handleSave(data) {
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
      } else {
        await createTransaction(data);
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir essa transação?')) return;
    try {
      await deleteTransaction(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
    }
  }

  const filtered = transactions.filter((t) => {
    if (filter === 'ALL') return true;
    return t.category.type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            Transações
          </h1>
          <p className="text-muted text-[12.5px] mt-1">
            Todas as suas movimentações financeiras
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-accent text-bg px-4 py-2.5 rounded-[10px] text-[12.5px] font-semibold"
        >
          <Plus size={15} />
          Nova transação
        </button>
      </div>

      <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[13px] font-semibold">Histórico</p>
          <div className="flex gap-1.5">
            {[
              { key: 'ALL', label: 'Todas' },
              { key: 'INCOME', label: 'Receitas' },
              { key: 'EXPENSE', label: 'Despesas' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-[10.5px] px-2.5 py-1 rounded-full transition ${
                  filter === f.key
                    ? 'bg-panel-strong text-text'
                    : 'text-muted hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted text-sm py-4">Nenhuma transação encontrada.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10.5px] text-muted uppercase tracking-wide">
                <th className="font-medium pb-3">Transação</th>
                <th className="font-medium pb-3">Categoria</th>
                <th className="font-medium pb-3">Data</th>
                <th className="font-medium pb-3 text-right">Valor</th>
                <th className="font-medium pb-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const Icon = getCategoryIcon(t.category.name);
                return (
                  <tr key={t.id} className="border-t border-panel-border group">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[10px] bg-panel-strong border border-panel-border flex items-center justify-center flex-shrink-0">
                          <Icon size={13} className="text-[#D9D8D3]" />
                        </div>
                        <span className="text-[12.5px] font-medium">{t.description}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-[10.5px] text-muted bg-panel-strong border border-panel-border px-2 py-1 rounded-full">
                        {t.category.name}
                      </span>
                    </td>
                    <td className="py-3 text-[11.5px] text-muted">
                      {new Date(t.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td
                      className={`py-3 text-right num text-[12.5px] font-semibold ${
                        t.category.type === 'INCOME' ? 'text-pos' : 'text-text'
                      }`}
                    >
                      {t.category.type === 'INCOME' ? '+' : '-'}R${' '}
                      {Number(t.amount).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEditModal(t)}
                          className="text-muted hover:text-text"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-muted hover:text-neg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        categories={categories}
        transaction={editingTransaction}
      />
    </div>
  );
}

export default Transactions;