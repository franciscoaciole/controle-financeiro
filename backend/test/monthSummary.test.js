const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseMonth,
  currentMonthKey,
  buildMonthStats,
  buildPrompt,
} = require('../src/lib/monthSummary');

const tx = (amount, name, type, date = '2026-10-10') => ({
  amount,
  date: new Date(`${date}T00:00:00Z`),
  category: { name, type },
});

test('parseMonth aceita AAAA-MM e calcula o intervalo em UTC', () => {
  const range = parseMonth('2026-01');
  assert.equal(range.start.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-02-01T00:00:00.000Z');
  // mês anterior a janeiro é dezembro do ano passado
  assert.equal(range.prevStart.toISOString(), '2025-12-01T00:00:00.000Z');
});

test('parseMonth recusa formatos inválidos', () => {
  for (const value of ['2026-13', '2026-1', '10/2026', '', null, 202610, '1999-05']) {
    assert.equal(parseMonth(value), null, `deveria recusar ${value}`);
  }
});

test('currentMonthKey usa UTC com dois dígitos', () => {
  assert.equal(currentMonthKey(new Date('2026-03-15T12:00:00Z')), '2026-03');
});

test('buildMonthStats soma receitas, despesas e compara com o mês anterior', () => {
  const current = [
    tx(5000, 'Salário', 'INCOME'),
    tx('300.50', 'Alimentação', 'EXPENSE'),
    tx(700, 'Moradia', 'EXPENSE'),
  ];
  const previous = [tx(200, 'Alimentação', 'EXPENSE', '2026-09-05')];

  const stats = buildMonthStats(current, previous);

  assert.equal(stats.income, 5000);
  assert.equal(stats.expense, 1000.5);
  assert.equal(stats.balance, 3999.5);
  assert.equal(stats.savingsRate, 79.99);
  assert.equal(stats.transactionCount, 3);
  assert.equal(stats.expensesByCategory[0].name, 'Moradia'); // maior gasto primeiro
  const food = stats.expensesByCategory.find((c) => c.name === 'Alimentação');
  assert.equal(food.changePct, 50.25);
  assert.equal(stats.expensesByCategory[0].changePct, null); // sem base no mês anterior
  assert.equal(stats.previousMonth.hasData, true);
});

test('buildMonthStats sem receita não calcula taxa de economia', () => {
  const stats = buildMonthStats([tx(80, 'Transporte', 'EXPENSE')], []);
  assert.equal(stats.savingsRate, null);
  assert.equal(stats.previousMonth.hasData, false);
});

test('o prompt leva só números agregados, nunca descrições', () => {
  const current = [{ ...tx(50, 'Transporte', 'EXPENSE'), description: 'uber casa da Ana' }];
  const prompt = buildPrompt('2026-10', buildMonthStats(current, []));
  assert.ok(prompt.includes('2026-10'));
  assert.ok(!prompt.includes('uber'));
});
