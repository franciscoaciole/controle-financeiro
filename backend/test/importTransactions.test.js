const test = require('node:test');
const assert = require('node:assert/strict');
const { parseImportBatch, MAX_IMPORT } = require('../src/lib/validators');

// Troca o módulo do Prisma por um falso, antes de carregar o controller
const prismaPath = require.resolve('../src/lib/prisma');
const fakePrisma = {
  category: { findMany: async () => [] },
  transaction: { createMany: async () => ({ count: 0 }) },
};
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: fakePrisma };
const { importMany } = require('../src/controllers/transactionController');

const valid = (over = {}) => ({
  description: 'Uber',
  amount: 25.9,
  date: '2026-10-20',
  categoryId: 'cat-1',
  ...over,
});

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('parseImportBatch aceita lote válido e normaliza os campos', () => {
  const r = parseImportBatch({ transactions: [valid({ description: '  Uber  ', amount: '25.905' })] });
  assert.equal(r.error, undefined);
  assert.equal(r.data[0].description, 'Uber');
  assert.equal(r.data[0].amount, 25.91);
  assert.ok(r.data[0].date instanceof Date);
});

test('parseImportBatch recusa corpo vazio, não-lista e lote grande demais', () => {
  assert.ok(parseImportBatch(undefined).error);
  assert.ok(parseImportBatch({}).error);
  assert.ok(parseImportBatch({ transactions: [] }).error);
  assert.ok(parseImportBatch({ transactions: 'x' }).error);
  const tooMany = Array.from({ length: MAX_IMPORT + 1 }, () => valid());
  assert.match(parseImportBatch({ transactions: tooMany }).error, /Máximo/);
});

test('parseImportBatch aponta a linha com problema', () => {
  assert.match(parseImportBatch({ transactions: [valid(), valid({ amount: 0 })] }).error, /Linha 2.*valor/);
  assert.match(parseImportBatch({ transactions: [valid({ description: '' })] }).error, /Linha 1.*descrição/);
  assert.match(parseImportBatch({ transactions: [valid({ date: 'xx' })] }).error, /Linha 1.*data/);
  assert.match(parseImportBatch({ transactions: [valid({ categoryId: '' })] }).error, /Linha 1.*categoria/);
  assert.match(parseImportBatch({ transactions: [null] }).error, /Linha 1/);
});

test('importMany grava tudo de uma vez e força o userId do token', async () => {
  let created;
  fakePrisma.category.findMany = async ({ where }) => {
    assert.equal(where.userId, 'u1');
    return where.id.in.map((id) => ({ id }));
  };
  fakePrisma.transaction.createMany = async ({ data }) => {
    created = data;
    return { count: data.length };
  };

  const res = fakeRes();
  await importMany(
    {
      userId: 'u1',
      body: { transactions: [valid(), valid({ categoryId: 'cat-2' }), valid({ userId: 'hacker' })] },
    },
    res
  );

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { imported: 3 });
  assert.ok(created.every((t) => t.userId === 'u1'));
});

test('importMany recusa categoria de outro usuário e não grava nada', async () => {
  let called = false;
  fakePrisma.category.findMany = async () => [{ id: 'cat-1' }]; // cat-2 não é do usuário
  fakePrisma.transaction.createMany = async () => {
    called = true;
    return { count: 0 };
  };

  const res = fakeRes();
  await importMany(
    { userId: 'u1', body: { transactions: [valid(), valid({ categoryId: 'cat-2' })] } },
    res
  );

  assert.equal(res.statusCode, 404);
  assert.equal(called, false);
});

test('importMany devolve 400 para lote inválido sem consultar o banco', async () => {
  let queried = false;
  fakePrisma.category.findMany = async () => {
    queried = true;
    return [];
  };
  const res = fakeRes();
  await importMany({ userId: 'u1', body: { transactions: [valid({ amount: -5 })] } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(queried, false);
});

test('importMany devolve 500 se o banco falhar', async () => {
  fakePrisma.category.findMany = async () => {
    throw new Error('banco fora do ar');
  };
  const originalError = console.error;
  console.error = () => {};
  const res = fakeRes();
  await importMany({ userId: 'u1', body: { transactions: [valid()] } }, res);
  console.error = originalError;
  assert.equal(res.statusCode, 500);
});
