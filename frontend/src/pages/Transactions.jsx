import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactions';
import { getCategories } from '../services/categories';
import TransactionModal from '../components/TransactionModal';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Transações</h1>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm transition"
        >
          <Plus size={16} />
          Nova
        </button>
      </div>

      {/* Lista */}
      {transactions.length === 0 ? (
        <p className="text-white/40 text-sm">Nenhuma transação ainda.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex justify-between items-center py-3 border-b border-white/5 group"
            >
              <div>
                <p className="text-sm">{t.description}</p>
                <p className="text-xs text-white/40">{t.category.name}</p>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={
                    t.category.type === 'INCOME'
                      ? 'text-green-400 text-sm'
                      : 'text-red-400 text-sm'
                  }
                >
                  {t.category.type === 'INCOME' ? '+' : '-'}R${' '}
                  {Number(t.amount).toFixed(2)}
                </span>

                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                  <button
                    onClick={() => openEditModal(t)}
                    className="text-white/50 hover:text-white"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-white/50 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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