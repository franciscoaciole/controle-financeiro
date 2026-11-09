const test = require('node:test');
const assert = require('node:assert/strict');

let rows = [];
let lastWhere = null;
let aiResult = 'Resumo de teste.';
let aiCalls = 0;

const fakePrisma = {
  transaction: {
    findMany: async ({ where }) => {
      lastWhere = where;
      return rows;
    },
  },
};

const prismaPath = require.resolve('../src/lib/prisma');
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: fakePrisma };

const anthropic = require('../src/services/anthropic');
anthropic.generateText = async () => {
  aiCalls += 1;
  if (aiResult instanceof Error) throw aiResult;
  return aiResult;
};

const { monthInsight } = require('../src/controllers/insightController');

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

const tx = (amount, type, date) => ({
  amount,
  date: new Date(`${date}T00:00:00Z`),
  category: { name: type === 'INCOME' ? 'Salário' : 'Alimentação', type },
});

async function call(body) {
  const res = fakeRes();
  await monthInsight({ userId: 'user-1', body }, res);
  return res;
}

test('recusa mês em formato inválido sem chamar a IA', async () => {
  aiCalls = 0;
  const res = await call({ month: 'outubro' });
  assert.equal(res.statusCode, 400);
  assert.equal(aiCalls, 0);
});

test('mês sem transações responde 422 sem gastar chamada da IA', async () => {
  aiCalls = 0;
  rows = [tx(100, 'EXPENSE', '2026-09-10')]; // só o mês anterior
  const res = await call({ month: '2026-10' });
  assert.equal(res.statusCode, 422);
  assert.equal(aiCalls, 0);
});

test('busca só as transações do próprio usuário e devolve o resumo', async () => {
  aiResult = 'Resumo de teste.';
  rows = [tx(3000, 'INCOME', '2026-10-05'), tx(400, 'EXPENSE', '2026-10-12'), tx(300, 'EXPENSE', '2026-09-12')];
  const res = await call({ month: '2026-10' });

  assert.equal(lastWhere.userId, 'user-1');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.summary, 'Resumo de teste.');
  assert.equal(res.body.stats.expense, 400); // setembro não entra no total de outubro
  assert.equal(res.body.stats.previousMonth.expense, 300);
});

test('erro da IA vira mensagem clara com o status certo', async () => {
  aiResult = new anthropic.AiError('Resumo com IA não está configurado no servidor.', 503);
  rows = [tx(50, 'EXPENSE', '2026-10-01')];
  const res = await call({ month: '2026-10' });
  assert.equal(res.statusCode, 503);
  assert.match(res.body.error, /não está configurado/);
});
