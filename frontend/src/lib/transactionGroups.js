import { normalize } from './categorySuggestion.js';
import { monthKeyOf } from './months.js';
import { toISODate } from './dates.js';

// "2026-11-05T00:00:00.000Z" -> "2026-11-05" (dia de calendário, em UTC)
export function dayKeyOf(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// Aplica todos os filtros da tela de Transações de uma vez.
// Com busca preenchida, procura em todos os meses (é o que a pessoa espera de uma busca).
export function filterTransactions(transactions, { month = 'all', query = '', type = 'ALL', categoryId = '' } = {}) {
  const q = normalize(query.trim());

  return transactions.filter((t) => {
    if (type !== 'ALL' && t.category.type !== type) return false;
    if (categoryId && t.category.id !== categoryId) return false;
    if (q) return normalize(t.description).includes(q);
    if (month !== 'all' && monthKeyOf(t.date) !== month) return false;
    return true;
  });
}

// Agrupa por dia (mais recente primeiro) com o saldo do dia
export function groupByDay(transactions) {
  const groups = new Map();

  for (const t of transactions) {
    const key = dayKeyOf(t.date);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { key, items: [], income: 0, expense: 0 });
    const group = groups.get(key);
    group.items.push(t);
    if (t.category.type === 'INCOME') group.income += Number(t.amount);
    else group.expense += Number(t.amount);
  }

  return [...groups.values()]
    .map((g) => ({ ...g, net: g.income - g.expense }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

// Entradas e saídas de cada dia, para o tooltip do gráfico
export function dailyTotals(transactions) {
  const totals = {};
  for (const t of transactions) {
    const key = dayKeyOf(t.date);
    if (!key) continue;
    totals[key] ??= { income: 0, expense: 0 };
    if (t.category.type === 'INCOME') totals[key].income += Number(t.amount);
    else totals[key].expense += Number(t.amount);
  }
  return totals;
}

// Soma de um conjunto: entradas, saídas e saldo
export function sumTransactions(transactions) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.category.type === 'INCOME') income += Number(t.amount);
    else expense += Number(t.amount);
  }
  return { income, expense, net: income - expense };
}

// "Hoje", "Ontem" ou "qua., 5 de nov." (o "hoje" vem do relógio local)
export function dayLabel(key, now = new Date()) {
  const today = toISODate(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toISODate(yesterdayDate);

  if (key === today) return 'Hoje';
  if (key === yesterday) return 'Ontem';

  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const sameYear = y === now.getFullYear();
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  });
}

// Insere de volta uma transação removida, mantendo a ordem por data (mais recente primeiro)
export function restoreTransaction(list, transaction) {
  if (list.some((t) => t.id === transaction.id)) return list;
  return [...list, transaction].sort((a, b) => new Date(b.date) - new Date(a.date));
}
