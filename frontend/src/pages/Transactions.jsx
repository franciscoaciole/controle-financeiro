import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactions';
import { getCategories } from '../services/categories';
import TransactionModal from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';
import { showToast, getErrorMessage } from '../lib/toast';

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
      showToast(
        editingTransaction ? 'Transação atualizada.' : 'Transação criada.',
        'success'
      );
      loadData();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      showToast(getErrorMessage(error, 'Não foi possível salvar a transação.'));
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir essa transação?')) return;
    try {
      await deleteTransaction(id);
      showToast('Transação excluída.', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      showToast(getErrorMessage(error, 'Não foi possível excluir a transação.'));
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
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6 md:mb-8">
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
          className="flex items-center justify-center gap-2 bg-accent text-bg px-4 py-3 sm:py-2.5 rounded-[10px] text-[12.5px] font-semibold w-full sm:w-auto"
        >
          <Plus size={15} />
          Nova transação
        </button>
      </div>

      <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
                className={`text-[11.5px] md:text-[10.5px] px-3 py-1.5 md:px-2.5 md:py-1 rounded-full transition ${
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
          <TransactionList
            transactions={filtered}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
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