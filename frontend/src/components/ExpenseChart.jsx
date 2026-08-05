import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function ExpenseChart({ data, currentBalance }) {
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: item.date.split('-').reverse().slice(0, 2).join('/'),
  }));

  return (
    <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-6">
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <p className="text-[13px] font-semibold">Evolução do saldo</p>
          <p className="num text-xl font-semibold mt-1">
            R$ {currentBalance?.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-1.5">
          {['3M', '6M', '1A'].map((label) => (
            <span
              key={label}
              className={`text-[10.5px] px-2.5 py-1 rounded-full ${
                label === '6M' ? 'bg-panel-strong text-text' : 'text-muted'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={formattedData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EDEAE0" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#EDEAE0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="displayDate" stroke="#59585F" fontSize={10.5} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#15151b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#F5F5F4' }}
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Saldo']}
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