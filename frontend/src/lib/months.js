// As datas das transações são dia de calendário gravado em UTC,
// então o mês de uma transação é lido em UTC.
export function monthKeyOf(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Mês de hoje pelo relógio local (é o mês que a pessoa está vivendo)
export function currentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Meses (AAAA-MM) que têm transações, do mais recente para o mais antigo.
export function monthsWithTransactions(transactions, limit = 12) {
  const keys = new Set();
  for (const t of transactions) {
    const key = monthKeyOf(t.date);
    if (key) keys.add(key);
  }
  return [...keys].sort().reverse().slice(0, limit);
}

// "2026-10" + 1 -> "2026-11"; "2026-01" - 1 -> "2025-12"
export function shiftMonth(key, delta) {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isValidMonthKey(value) {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
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
