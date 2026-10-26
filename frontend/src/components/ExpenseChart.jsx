import { useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../lib/format';

const PERIODS = [
  { key: '1M', label: '1M', months: 1, text: 'no último mês' },
  { key: '3M', label: '3M', months: 3, text: 'nos últimos 3 meses' },
  { key: '6M', label: '6M', months: 6, text: 'nos últimos 6 meses' },
  { key: '1A', label: '1A', months: 12, text: 'no último ano' },
];

// Data de corte (AAAA-MM-DD) pelo relógio local, N meses atrás
function cutoffDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function ExpenseChart({ data }) {
  const [period, setPeriod] = useState('3M');

  const current = PERIODS.find((p) => p.key === period);
  const cutoff = cutoffDate(current.months);

  // As datas vêm como AAAA-MM-DD e já ordenadas, então a comparação de texto funciona
  const inRange = data.filter((item) => item.date >= cutoff);
  const before = data.filter((item) => item.date < cutoff);

  // Saldo no começo da janela = último saldo antes dela (ou 0 se não houver)
  const baseline = before.length ? before[before.length - 1].balance : 0;
  const last = inRange.length ? inRange[inRange.length - 1].balance : baseline;
  const change = last - baseline;

  const formattedData = inRange.map((item) => ({
    ...item,
    displayDate: item.date.split('-').reverse().slice(0, 2).join('/'),
  }));

  return (
    <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-5 md:p-6 min-w-0 flex flex-1 flex-col min-h-[300px]">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[13px] font-semibold">Evolução do saldo</p>
          <p className="text-[11px] text-muted mt-0.5">
            Variação {current.text}:{' '}
            <span className={`num font-medium ${change >= 0 ? 'text-pos' : 'text-neg'}`}>
              {change >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(change))}
            </span>
          </p>
        </div>

        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              aria-pressed={period === p.key}
              className={`text-[11.5px] md:text-[10.5px] px-3 py-1.5 md:px-2.5 md:py-1 rounded-full transition ${
                period === p.key
                  ? 'bg-panel-strong text-text'
                  : 'text-muted hover:text-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {formattedData.length < 2 ? (
        <p className="text-muted text-[12.5px] py-10 text-center">
          Poucas movimentações {current.text} para desenhar o gráfico.
        </p>
      ) : (
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 16, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EDEAE0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EDEAE0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#59585F"
                fontSize={10.5}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#15151b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#F5F5F4' }}
                formatter={(value) => [formatCurrency(value), 'Saldo']}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#EDEAE0"
                strokeWidth={2}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ExpenseChart;
