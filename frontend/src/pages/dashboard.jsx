import { useEffect, useState } from 'react';
import { getSummary, getTransactions } from '../services/transactions';
import ExpenseChart from '../components/ExpenseChart';
import CategoryDonut from '../components/CategoryDonut';
import TransactionsTable from '../components/TransactionsTable';

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
        console.error('Erro ao carregar dados:', error);
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[22px] font-semibold tracking-tight">
          Visão geral
        </h1>
        <p className="text-muted text-[12.5px] mt-1">
          Acompanhe suas finanças em um só lugar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-[18px] mb-[18px]">
        <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-[26px_28px] flex flex-col justify-between">
          <div>
            <p className="text-muted text-xs mb-2.5">Saldo total</p>
            <p className="num text-[38px] md:text-[44px] font-semibold tracking-tight">
              R$ {summary?.balance.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <div className="flex-1 border-t border-panel-border pt-3">
              <p className="text-[10.5px] text-muted mb-1">Receitas totais</p>
              <p className="num text-[16.5px] font-semibold text-pos">
                R$ {summary?.totalIncome.toFixed(2)}
              </p>
            </div>
            <div className="flex-1 border-t border-panel-border pt-3">
              <p className="text-[10.5px] text-muted mb-1">Despesas totais</p>
              <p className="num text-[16.5px] font-semibold">
                R$ {summary?.totalExpense.toFixed(2)}
              </p>
            </div>
            <div className="flex-1 border-t border-panel-border pt-3">
              <p className="text-[10.5px] text-muted mb-1">Economia</p>
              <p className="num text-[16.5px] font-semibold">
                R$ {summary?.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <CategoryDonut transactions={transactions} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-[18px]">
        {summary?.dailyData?.length > 0 && (
          <ExpenseChart data={summary.dailyData} currentBalance={summary.balance} />
        )}
        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}

export default Dashboard;