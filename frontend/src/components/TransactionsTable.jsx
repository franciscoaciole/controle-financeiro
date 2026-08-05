import { ShoppingCart, Car, Home, Utensils, HeartPulse, Tv, Wallet } from 'lucide-react';

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

function TransactionsTable({ transactions }) {
  return (
    <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-6 flex flex-col">
      <p className="text-[13px] font-semibold mb-4">Transações recentes</p>

      {transactions.length === 0 ? (
        <p className="text-muted text-sm">Nenhuma transação ainda.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] text-muted uppercase tracking-wide">
              <th className="font-medium pb-3">Transação</th>
              <th className="font-medium pb-3">Categoria</th>
              <th className="font-medium pb-3">Data</th>
              <th className="font-medium pb-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 6).map((t) => {
              const Icon = getCategoryIcon(t.category.name);
              return (
                <tr key={t.id} className="border-t border-panel-border">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TransactionsTable;