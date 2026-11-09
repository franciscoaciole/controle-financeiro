const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseMonth,
  currentMonthKey,
  buildMonthStats,
  buildSummaryText,
} = require('../src/lib/monthSummary');

const tx = (amount, name, type, date = '2026-10-10') => ({
  amount,
  date: new Date(`${date}T00:00:00Z`),
  category: { name, type },
});

// O texto usa espaço não separável depois de "R$"; aqui ele vira espaço comum
// só para os textos esperados ficarem legíveis.
const summary = (current, previous = [], month = '2026-10', options) =>
  buildSummaryText(month, buildMonthStats(current, previous), options).replace(/\u00a0/g, ' ');

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

test('resumo completo: panorama, comparação e sugestão sobre o maior aumento', () => {
  const text = summary(
    [tx(5000, 'Salário', 'INCOME'), tx('300.50', 'Alimentação', 'EXPENSE'), tx(700, 'Moradia', 'EXPENSE')],
    [tx(200, 'Alimentação', 'EXPENSE', '2026-09-05'), tx(600, 'Moradia', 'EXPENSE', '2026-09-06')],
  );
  const [overview, highlights, suggestion] = text.split('\n\n');

  assert.equal(
    overview,
    'Em outubro você recebeu R$ 5.000,00 e gastou R$ 1.000,50. Sobraram R$ 3.999,50, ou 80% da renda.',
  );
  assert.equal(
    highlights,
    'O maior gasto foi Moradia, com R$ 700,00 (70% das despesas). ' +
      'No total, as despesas subiram 25,1% em relação a setembro. ' +
      'O maior aumento foi em Alimentação: de R$ 200,00 para R$ 300,50.',
  );
  assert.equal(suggestion, 'Para o próximo mês, vale acompanhar Alimentação, que teve o maior aumento.');
});

test('mês no vermelho sugere rever a maior categoria', () => {
  const text = summary([tx(1000, 'Salário', 'INCOME'), tx(1500, 'Moradia', 'EXPENSE')]);
  assert.match(text, /As despesas passaram as receitas em R\$ 500,00\./);
  assert.match(text, /Não há transações no mês anterior para comparar\./);
  assert.match(text, /vale rever os gastos com Moradia/);
});

test('mês só com receitas não inventa destaques de gastos', () => {
  const text = summary([tx(2000, 'Salário', 'INCOME')]);
  assert.match(text, /recebeu R\$ 2\.000,00 e não registrou despesas\. Sobraram R\$ 2\.000,00, ou 100% da renda\./);
  assert.match(text, /Não houve despesas no mês/);
});

test('mês só com despesas e janeiro compara com dezembro', () => {
  const text = summary(
    [tx(80, 'Transporte', 'EXPENSE', '2026-01-10')],
    [tx(100, 'Transporte', 'EXPENSE', '2025-12-10')],
    '2026-01',
  );
  assert.match(text, /^Em janeiro você gastou R\$ 80,00 e não registrou receitas\.\n\n/);
  assert.match(text, /as despesas caíram 20% em relação a dezembro\./);
  assert.ok(!text.includes('maior aumento'));
});

test('o resumo usa só números agregados, nunca descrições', () => {
  const current = [{ ...tx(50, 'Transporte', 'EXPENSE'), description: 'uber casa da Ana' }];
  assert.ok(!summary(current).includes('uber'));
});

test('o valor em reais não quebra entre "R$" e o número', () => {
  const raw = buildSummaryText('2026-10', buildMonthStats([tx(101.9, 'Lazer', 'EXPENSE')], []));
  assert.ok(raw.includes('R$\u00a0101,90'));
  assert.ok(!raw.includes('R$ 101,90'));
});

test('mês em andamento fala em "até agora" e não compara com o mês anterior', () => {
  const text = summary(
    [tx(3000, 'Salário', 'INCOME', '2026-11-05'), tx(50, 'Lazer', 'EXPENSE', '2026-11-06')],
    [tx(2000, 'Lazer', 'EXPENSE', '2026-10-06')],
    '2026-11',
    { ongoing: true },
  );
  const [overview, highlights, suggestion] = text.split('\n\n');

  assert.equal(
    overview,
    'Até agora, em novembro, você recebeu R$ 3.000,00 e gastou R$ 50,00. Por enquanto sobram R$ 2.950,00, ou 98,3% da renda.',
  );
  assert.match(highlights, /^O maior gasto até agora é Lazer/);
  assert.match(highlights, /aparece quando o mês terminar/);
  assert.ok(!text.includes('caíram'));
  assert.match(suggestion, /^Até o fim do mês/);
});

test('sem receitas registradas não fala em "fechar no azul"', () => {
  const text = summary([tx(61.12, 'Entretenimento', 'EXPENSE', '2026-11-03')], [], '2026-11', { ongoing: true });
  assert.ok(!text.includes('no azul'));
  assert.match(text, /registre também suas receitas/);
});

test('mês no vermelho com receita continua sugerindo fechar no azul', () => {
  const text = summary([tx(1000, 'Salário', 'INCOME'), tx(1500, 'Moradia', 'EXPENSE')]);
  assert.match(text, /para fechar no azul\.$/);
});
