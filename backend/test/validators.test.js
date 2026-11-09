const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseDescription,
  parseAmount,
  parseDate,
  parseCategoryName,
  parseRegister,
} = require('../src/lib/validators');
const defaultCategories = require('../src/lib/defaultCategories');

test('parseAmount aceita valores positivos e arredonda para 2 casas', () => {
  assert.equal(parseAmount(25.9), 25.9);
  assert.equal(parseAmount('25.90'), 25.9);
  assert.equal(parseAmount(10.456), 10.46);
});

test('parseAmount recusa zero, negativos, texto e valores absurdos', () => {
  assert.equal(parseAmount(0), null);
  assert.equal(parseAmount(-50), null);
  assert.equal(parseAmount('abc'), null);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount(null), null);
  assert.equal(parseAmount(Infinity), null);
  assert.equal(parseAmount(1e12), null);
});

test('parseAmount respeita o máximo da coluna Decimal(10, 2)', () => {
  assert.equal(parseAmount(99999999.99), 99999999.99);
  assert.equal(parseAmount('99999999.99'), 99999999.99);
  // antes passava na validação e estourava no banco (HTTP 500)
  assert.equal(parseAmount(100000000), null);
  assert.equal(parseAmount(500000000), null);
});

test('parseDescription remove espaços e respeita o limite de 100 caracteres', () => {
  assert.equal(parseDescription('  Uber  '), 'Uber');
  assert.equal(parseDescription('a'.repeat(100)), 'a'.repeat(100));
  assert.equal(parseDescription('a'.repeat(101)), null);
  assert.equal(parseDescription('   '), null);
  assert.equal(parseDescription(123), null);
});

test('parseDate trata a data como dia de calendário em UTC', () => {
  const d = parseDate('2026-10-11');
  assert.equal(d.getUTCFullYear(), 2026);
  assert.equal(d.getUTCMonth(), 9);
  assert.equal(d.getUTCDate(), 11);
  assert.equal(parseDate('lixo'), null);
  assert.equal(parseDate(20261011), null);
});

test('parseCategoryName respeita o limite de 40 caracteres', () => {
  assert.equal(parseCategoryName('  Pets '), 'Pets');
  assert.equal(parseCategoryName('a'.repeat(40)), 'a'.repeat(40));
  assert.equal(parseCategoryName('a'.repeat(41)), null);
  assert.equal(parseCategoryName(''), null);
});

test('parseRegister normaliza nome e email e mantém a senha como veio', () => {
  const result = parseRegister({
    name: '  Maria  ',
    email: '  MARIA@Exemplo.com ',
    password: 'senha com espaço',
  });
  assert.equal(result.error, undefined);
  assert.deepEqual(result.data, {
    name: 'Maria',
    email: 'maria@exemplo.com',
    password: 'senha com espaço',
  });
});

test('parseRegister recusa dados inválidos', () => {
  const valid = { name: 'Maria', email: 'maria@exemplo.com', password: '12345678' };

  assert.ok(parseRegister(undefined).error);
  assert.ok(parseRegister({ ...valid, name: 'A' }).error);
  assert.ok(parseRegister({ ...valid, email: 'x' }).error);
  assert.ok(parseRegister({ ...valid, email: 'a b@c.com' }).error);
  assert.ok(parseRegister({ ...valid, password: '1234567' }).error);
  assert.ok(parseRegister({ ...valid, password: 'a'.repeat(73) }).error);
  assert.ok(parseRegister({ ...valid, password: 12345678 }).error);
});

test('categorias padrão: 7 categorias, nomes únicos e só Salário é receita', () => {
  assert.equal(defaultCategories.length, 7);

  const names = defaultCategories.map((c) => c.name);
  assert.equal(new Set(names).size, 7);

  for (const category of defaultCategories) {
    assert.ok(['INCOME', 'EXPENSE'].includes(category.type));
  }

  const incomes = defaultCategories.filter((c) => c.type === 'INCOME');
  assert.equal(incomes.length, 1);
  assert.equal(incomes[0].name, 'Salário');
});

test('parseAmount recusa valores que arredondam para zero (BUG-01)', () => {
  assert.equal(parseAmount(0.001), null);
  assert.equal(parseAmount(0.004), null);
  assert.equal(parseAmount('0.001'), null);
  assert.equal(parseAmount(0.005), 0.01); // arredonda para cima: é o menor valor válido
  assert.equal(parseAmount(0.01), 0.01);
});

test('parseAmount recusa formatos estranhos em texto (BUG-01)', () => {
  assert.equal(parseAmount('1e3'), null);
  assert.equal(parseAmount('-5'), null);
  assert.equal(parseAmount('0x10'), null);
  assert.equal(parseAmount('Infinity'), null);
  assert.equal(parseAmount('10,50'), null); // a API recebe ponto; a vírgula é tratada na tela
  assert.equal(parseAmount(' 25.90 '), 25.9);
  assert.equal(parseAmount('25.905'), 25.91);
});

test('parseDate recusa datas impossíveis e fora da faixa (BUG-02)', () => {
  assert.equal(parseDate('2026-02-31'), null);
  assert.equal(parseDate('2026-13-01'), null);
  assert.equal(parseDate('2025-02-29'), null);
  assert.equal(parseDate('1'), null);
  assert.equal(parseDate('9999-12-31'), null);
  assert.equal(parseDate('1999-12-31'), null);
  assert.equal(parseDate('10/11/2026'), null);
});

test('parseDate aceita ano bissexto, limites da faixa e horário ISO', () => {
  assert.equal(parseDate('2028-02-29').toISOString(), '2028-02-29T00:00:00.000Z');
  assert.ok(parseDate('2000-01-01'));
  assert.ok(parseDate('2100-12-31'));
  assert.equal(parseDate('2026-11-05T12:30:00.000Z').toISOString(), '2026-11-05T12:30:00.000Z');
  assert.equal(parseDate(' 2026-11-05 ').toISOString(), '2026-11-05T00:00:00.000Z');
});
