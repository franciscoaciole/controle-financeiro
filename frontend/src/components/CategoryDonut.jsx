function CategoryDonut({ transactions }) {
  const expenses = transactions.filter((t) => t.category.type === 'EXPENSE');
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

  const byCategory = {};
  for (const t of expenses) {
    const name = t.category.name;
    byCategory[name] = (byCategory[name] || 0) + Number(t.amount);
  }

  const palette = ['#EDEAE0', '#A6A49A', '#66646B', '#39383E', '#8B8B96', '#5F5F6B'];

  const items = Object.entries(byCategory)
    .map(([name, value]) => ({
      name,
      value,
      pct: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .map((item, i) => ({ ...item, color: palette[i % palette.length] }));

  const circumference = 2 * Math.PI * 50;
  let offsetAcc = 0;
  const segments = items.map((item) => {
    const length = (item.pct / 100) * circumference;
    const segment = { ...item, length, offset: -offsetAcc };
    offsetAcc += length;
    return segment;
  });

  const topItem = items[0];

  return (
    <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-[22px_24px] flex flex-col">
      <p className="text-[13px] font-semibold mb-0.5">Gastos por categoria</p>
      <p className="text-[11px] text-muted mb-[18px]">
        R$ {totalExpense.toFixed(2)} total
      </p>

      {items.length === 0 ? (
        <p className="text-muted text-sm">Nenhuma despesa ainda.</p>
      ) : (
        <div className="flex items-center gap-5 flex-1">
          <div className="relative w-[104px] h-[104px] flex-shrink-0">
            <svg width="104" height="104" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
              {segments.map((seg, i) => (
                <circle
                  key={i}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="14"
                  strokeDasharray={`${seg.length} ${circumference}`}
                  strokeDashoffset={seg.offset}
                  strokeLinecap="round"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-sm font-semibold">{topItem?.pct.toFixed(0)}%</span>
              <span className="text-[8px] text-muted mt-0.5">maior</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-[9px]">
            {items.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-[11.5px]">
                <span
                  className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#D9D8D3]">{item.name}</span>
                <span className="num ml-auto text-muted text-[10.5px]">
                  {item.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryDonut;