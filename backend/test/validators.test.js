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
