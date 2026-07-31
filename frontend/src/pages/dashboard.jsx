import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSummary, getTransactions } from '../services/transactions';
import { TrendingUp, TrendingDown, LogOut, ArrowRight } from 'lucide-react';

function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, transactionsData] = await Promise.all([
          getSummary(),
          getTransactions(),
        ]);
        setSummary(summaryData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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
        <h1 className="text-2xl font-bold">Olá, {user?.name}!</h1>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>

      {/* Card de saldo (glassmorphism) */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-sm text-white/50 mb-1">Saldo total</p>
        <p className="text-3xl font-semibold">
          R$ {summary?.balance.toFixed(2)}
        </p>
      </div>

      {/* Cards de receita/despesa */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#14141B] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-green-400">
            <TrendingUp size={16} />
            <span className="text-xs text-white/50">Receitas</span>
          </div>
          <p className="text-lg font-medium text-green-400">
            R$ {summary?.totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#14141B] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-red-400">
            <TrendingDown size={16} />
            <span className="text-xs text-white/50">Despesas</span>
          </div>
          <p className="text-lg font-medium text-red-400">
            R$ {summary?.totalExpense.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Links de navegação */}
      <div className="flex gap-4 mb-6">
        <Link
          to="/transactions"
          className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
        >
          Ver transações <ArrowRight size={14} />
        </Link>
        <Link
          to="/categories"
          className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
        >
          Gerenciar categorias <ArrowRight size={14} />
        </Link>
      </div>

      {/* Lista de transações */}
      <div>
        <h2 className="text-sm font-medium text-white/70 mb-3 mt-4">
          Últimas transações
        </h2>

        {transactions.length === 0 ? (
          <p className="text-white/40 text-sm">Nenhuma transação ainda.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center py-3 border-b border-white/5"
              >
                <div>
                  <p className="text-sm">{t.description}</p>
                  <p className="text-xs text-white/40">{t.category.name}</p>
                </div>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;