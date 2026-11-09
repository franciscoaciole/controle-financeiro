import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dayKeyOf,
  filterTransactions,
  groupByDay,
  dailyTotals,
  sumTransactions,
  dayLabel,
  restoreTransaction,
} from '../src/lib/transactionGroups.js';

const cat = {
  food: { id: 'c1', name: 'Alimentação', type: 'EXPENSE' },
  salary: { id: 'c2', name: 'Salário', type: 'INCOME' },
  transport: { id: 'c3', name: 'Transporte', type: 'EXPENSE' },
};
const tx = (id, description, amount, date, category) => ({
  id,
  description,
  amount,
  date: `${date}T00:00:00.000Z`,
  category,
});

const list = [
  tx('1', 'Salário outubro', '5000.00', '2026-10-05', cat.salary),
  tx('2', 'Padaria', '12.50', '2026-10-05', cat.food),
  tx('3', 'Uber', '25.90', '2026-10-25', cat.transport),
  tx('4', 'Pão de açúcar', '230.00', '2026-11-02', cat.food),
];

test('dayKeyOf lê o dia em UTC (meia-noite não volta um dia)', () => {
  assert.equal(dayKeyOf('2026-11-01T00:00:00.000Z'), '2026-11-01');
  assert.equal(dayKeyOf('inválida'), null);
});

test('filtra por mês, tipo e categoria', () => {
  assert.deepEqual(filterTransactions(list, { month: '2026-10' }).map((t) => t.id), ['1', '2', '3']);
  assert.deepEqual(filterTransactions(list, { month: '2026-10', type: 'EXPENSE' }).map((t) => t.id), ['2', '3']);
  assert.deepEqual(filterTransactions(list, { month: 'all', categoryId: 'c1' }).map((t) => t.id), ['2', '4']);
});

test('a busca ignora acentos e maiúsculas e procura em todos os meses', () => {
  const found = filterTransactions(list, { month: '2026-10', query: 'PAO DE ACUCAR' });
  assert.deepEqual(found.map((t) => t.id), ['4']); // novembro, mesmo com outubro selecionado
});

test('agrupa por dia, do mais recente para o mais antigo, com o saldo do dia', () => {
  const groups = groupByDay(filterTransactions(list, { month: '2026-10' }));
  assert.deepEqual(groups.map((g) => g.key), ['2026-10-25', '2026-10-05']);
  assert.equal(groups[1].items.length, 2);
  assert.equal(groups[1].net, 4987.5);
  assert.equal(groups[0].net, -25.9);
});

test('totais por dia para o gráfico', () => {
  const totals = dailyTotals(list);
  assert.deepEqual(totals['2026-10-05'], { income: 5000, expense: 12.5 });
  assert.deepEqual(totals['2026-10-25'], { income: 0, expense: 25.9 });
});

test('soma entradas, saídas e saldo', () => {
  const s = sumTransactions(list);
  assert.equal(s.income, 5000);
  assert.equal(Math.round(s.expense * 100) / 100, 268.4);
});

test('rótulo do dia: Hoje, Ontem e data por extenso', () => {
  const now = new Date(2026, 10, 9, 15, 0); // 9 de nov. de 2026, horário local
  assert.equal(dayLabel('2026-11-09', now), 'Hoje');
  assert.equal(dayLabel('2026-11-08', now), 'Ontem');
  assert.match(dayLabel('2026-11-05', now), /5 de nov/);
  assert.match(dayLabel('2025-12-31', now), /2025/); // outro ano mostra o ano
});

test('desfazer devolve a transação na posição certa, sem duplicar', () => {
  const without = list.filter((t) => t.id !== '3');
  const sorted = [...without].sort((a, b) => new Date(b.date) - new Date(a.date));
  const restored = restoreTransaction(sorted, list[2]);
  assert.deepEqual(restored.map((t) => t.id), ['4', '3', '1', '2']);
  assert.equal(restoreTransaction(restored, list[2]).length, 4);
});
