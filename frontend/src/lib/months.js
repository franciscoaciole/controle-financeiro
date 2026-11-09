// Meses (AAAA-MM) que têm transações, do mais recente para o mais antigo.
// As datas são dia de calendário em UTC, então o mês é lido em UTC.
export function monthsWithTransactions(transactions, limit = 12) {
  const keys = new Set();
  for (const t of transactions) {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue;
    keys.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return [...keys].sort().reverse().slice(0, limit);
}

// "2026-10" -> "outubro de 2026"
export function formatMonthKey(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
