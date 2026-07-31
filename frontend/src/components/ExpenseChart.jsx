import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function ExpenseChart({ data }) {
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: item.date.split('-').reverse().slice(0, 2).join('/'),
  }));

  const isPositive = data.length > 0 && data[data.length - 1].balance >= 0;
  const lineColor = isPositive ? '#5DCAA5' : '#F09595';

  return (
    <div className="bg-[#14141B] rounded-xl p-4">
      <p className="text-sm text-white/50 mb-4">Evolução do saldo</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formattedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="displayDate"
            stroke="#8A8A96"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#8A8A96"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A22',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#F5F5F7' }}
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Saldo']}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#colorBalance)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseChart;