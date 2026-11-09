import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../lib/format';

const PALETTE = ['#EDEAE0', '#A6A49A', '#66646B', '#39383E', '#8B8B96', '#5F5F6B'];

// Cada categoria do donut leva à tela de Transações já filtrada por ela e pelo mês
function linkFor(categoryId, monthKey) {
  const params = new URLSearchParams({ category: categoryId });
  if (monthKey) params.set('month', monthKey);
  return `/transactions?${params}`;
}

function CategoryDonut({ transactions, periodLabel, monthKey }) {
  const navigate = useNavigate();
  const expenses = transactions.filter((t) => t.category.type === 'EXPENSE');
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

  // Agrupa pelo id (duas categorias podem ter o mesmo nome)
  const byCategory = {};
  for (const t of expenses) {
    const { id, name } = t.category;
    byCategory[id] ??= { id, name, value: 0 };
    byCategory[id].value += Number(t.amount);
  }

  const items = Object.values(byCategory)
    .map((item) => ({
      ...item,
      pct: totalExpense > 0 ? (item.value / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .map((item, i) => ({ ...item, color: PALETTE[i % PALETTE.length] }));

  const circumference = 2 * Math.PI * 50;
  const segments = items.map((item, i) => {
    const length = (item.pct / 100) * circumference;
    const before = items
      .slice(0, i)
      .reduce((sum, prev) => sum + (prev.pct / 100) * circumference, 0);
    return { ...item, length, offset: -before };
  });

  const topItem = items[0];

  return (
    <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-5 md:p-[22px_24px] flex flex-col min-w-0">
      <p className="text-[13px] font-semibold mb-0.5">Gastos por categoria</p>
      <p className="text-[11px] text-muted mb-[18px]">
        <span className="money">{formatCurrency(totalExpense)}</span> em {periodLabel}
      </p>

      {items.length === 0 ? (
        <p className="text-muted text-sm">Nenhuma despesa em {periodLabel}.</p>
      ) : (
        <div className="flex items-center gap-4 sm:gap-5 flex-1">
          <div className="relative w-[104px] h-[104px] flex-shrink-0">
            {/* Os segmentos também levam à lista; o teclado usa a legenda ao lado */}
            <svg width="104" height="104" viewBox="0 0 120 120" className="-rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
              {segments.map((seg) => (
                <circle
                  key={seg.id}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="14"
                  strokeDasharray={`${seg.length} ${circumference}`}
                  strokeDashoffset={seg.offset}
                  strokeLinecap="round"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => navigate(linkFor(seg.id, monthKey))}
                >
                  <title>{seg.name}</title>
                </circle>
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="num text-sm font-semibold">{topItem?.pct.toFixed(0)}%</span>
              <span className="text-[8px] text-muted mt-0.5">maior</span>
            </div>
          </div>

          <ul className="flex-1 min-w-0 flex flex-col gap-1">
            {items.slice(0, 4).map((item) => (
              <li key={item.id}>
                <Link
                  to={linkFor(item.id, monthKey)}
                  className="group block min-w-0 text-[11.5px] rounded-lg px-2 py-1 -mx-2 hover:bg-panel-strong transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#D9D8D3] truncate">{item.name}</span>
                    <ChevronRight
                      size={12}
                      aria-hidden="true"
                      className="ml-auto text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="num flex items-center justify-between gap-2 pl-[15px] text-[10px]">
                    <span className="money text-muted">{formatCurrency(item.value)}</span>
                    <span className="text-muted-2">{item.pct.toFixed(0)}%</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CategoryDonut;
