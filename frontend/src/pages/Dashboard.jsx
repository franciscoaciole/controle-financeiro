import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSummary, getTransactions } from '../services/transactions';
import ExpenseChart from '../components/ExpenseChart';
import CategoryDonut from '../components/CategoryDonut';
import { formatCurrency } from '../lib/format';
import { showToast, getErrorMessage } from '../lib/toast';

// As datas são guardadas como dia de calendário (UTC), então o mês
// da transação é lido em UTC e comparado com o mês de hoje.
function isCurrentMonth(dateValue) {
  const now = new Date();
  const d = new Date(dateValue);
  return (
    d.getUTCFullYear() === now.getFullYear() && d.getUTCMonth() === now.getMonth()
  );
}

function Dashboard() {
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
        console.error('Erro ao carregar dados.');
        showToast(getErrorMessage(error, 'Não foi possível carregar o painel.'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Carregando...</p>
      </div>
    );
  }

  const monthTransactions = transactions.filter((t) => isCurrentMonth(t.date));
  const monthIncome = monthTransactions
    .filter((t) => t.category.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthExpense = monthTransactions
    .filter((t) => t.category.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-[22px] font-semibold tracking-tight">
          Visão geral
        </h1>
        <p className="text-muted text-[12.5px] mt-1">
          Acompanhe suas finanças em um só lugar
        </p>
      </div>

      {transactions.length === 0 && (
        <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-5 md:p-6 mb-4 md:mb-[18px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold">Comece pela sua primeira transação</p>
            <p className="text-muted text-[12.5px] mt-1">
              Suas categorias já estão prontas. Registre uma receita ou despesa e o
              painel ganha vida.
            </p>
          </div>
          <Link
            to="/transactions"
            className="bg-accent text-bg px-4 py-3 sm:py-2.5 rounded-[10px] text-[12.5px] font-semibold text-center whitespace-nowrap"
          >
            Adicionar transação
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 md:gap-[18px] mb-4 md:mb-[18px]">
        <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-5 md:p-[26px_28px] flex flex-col justify-between min-w-0">
          <div>
            <p className="text-muted text-xs mb-2.5">Saldo total</p>
            <p className="num text-[32px] sm:text-[38px] md:text-[44px] font-semibold tracking-tight leading-none">
              {formatCurrency(summary?.balance)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="border-t border-panel-border pt-3 min-w-0">
              <p className="text-[10.5px] text-muted mb-1">
                Receitas de {monthLabel}
              </p>
              <p className="num text-[15px] md:text-[16.5px] font-semibold text-pos truncate">
                {formatCurrency(monthIncome)}
              </p>
            </div>
            <div className="border-t border-panel-border pt-3 min-w-0">
              <p className="text-[10.5px] text-muted mb-1">
                Despesas de {monthLabel}
              </p>
              <p className="num text-[15px] md:text-[16.5px] font-semibold truncate">
                {formatCurrency(monthExpense)}
              </p>
            </div>
          </div>
        </div>

        <CategoryDonut transactions={monthTransactions} periodLabel={monthLabel} />
      </div>

      {summary?.dailyData?.length > 0 && <ExpenseChart data={summary.dailyData} />}
    </div>
  );
}

export default Dashboard;
