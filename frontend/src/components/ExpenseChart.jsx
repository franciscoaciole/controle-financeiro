import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../lib/format';

function ExpenseChart({ data }) {
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: item.date.split('-').reverse().slice(0, 2).join('/'),
  }));

  return (
    <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-5 md:p-6 min-w-0">
      <p className="text-[13px] font-semibold">Evolução do saldo</p>
      <p className="text-[11px] text-muted mt-0.5 mb-3">
        Saldo acumulado ao longo do tempo
      </p>

      <ResponsiveContainer width="100%" height={180}>
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
  );
}

export default ExpenseChart;
