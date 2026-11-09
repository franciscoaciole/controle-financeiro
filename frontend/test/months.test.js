import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthsWithTransactions, formatMonthKey } from '../src/lib/months.js';

test('lista meses com transações, mais recente primeiro e sem repetir', () => {
  const tx = [
    { date: '2026-08-15T00:00:00.000Z' },
    { date: '2026-10-01T00:00:00.000Z' },
    { date: '2026-10-31T00:00:00.000Z' },
    { date: 'data quebrada' },
  ];
  assert.deepEqual(monthsWithTransactions(tx), ['2026-10', '2026-08']);
});

test('dia 1º em UTC não escorrega para o mês anterior', () => {
  assert.deepEqual(monthsWithTransactions([{ date: '2026-09-01T00:00:00.000Z' }]), ['2026-09']);
});

test('respeita o limite de meses', () => {
  const tx = Array.from({ length: 15 }, (_, i) => ({
    date: new Date(Date.UTC(2025, i, 10)).toISOString(),
  }));
  assert.equal(monthsWithTransactions(tx, 12).length, 12);
});

test('formata o mês em português', () => {
  assert.equal(formatMonthKey('2026-10'), 'outubro de 2026');
});

import { shiftMonth, isValidMonthKey, monthKeyOf, currentMonthKey } from '../src/lib/months.js';

test('shiftMonth atravessa a virada do ano', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
});

test('valida a chave de mês vinda da URL', () => {
  assert.equal(isValidMonthKey('2026-10'), true);
  assert.equal(isValidMonthKey('2026-13'), false);
  assert.equal(isValidMonthKey('<script>'), false);
});

test('monthKeyOf usa UTC e currentMonthKey usa o relógio local', () => {
  assert.equal(monthKeyOf('2026-11-01T00:00:00.000Z'), '2026-11');
  assert.equal(currentMonthKey(new Date(2026, 0, 31, 23, 0)), '2026-01');
});
