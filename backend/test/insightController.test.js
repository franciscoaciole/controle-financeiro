const test = require('node:test');
const assert = require('node:assert/strict');

let rows = [];
let lastWhere = null;
let failNext = false;

const fakePrisma = {
  transaction: {
    findMany: async ({ where }) => {
      lastWhere = where;
      if (failNext) {
        failNext = false;
        throw new Error('banco fora do ar');
      }
      return rows;
    },
  },
};

const prismaPath = require.resolve('../src/lib/prisma');
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: fakePrisma };

// IA simulada: por padrão "falha" (null), como acontece sem GEMINI_API_KEY.
// Assim os testes nunca chamam a rede, mesmo com a chave no .env.
let aiResult = null;
let aiInput = null;
const aiPath = require.resolve('../src/lib/aiSummary');
require.cache[aiPath] = {
  id: aiPath,
  filename: aiPath,
  loaded: true,
  exports: {
    generateAiSummary: async (input) => {
      aiInput = input;
      return aiResult;
    },
  },
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

test('recusa mês em formato inválido sem consultar o banco', async () => {
  lastWhere = null;
  const res = await call({ month: 'outubro' });
  assert.equal(res.statusCode, 400);
  assert.equal(lastWhere, null);
});

test('mês sem transações responde 422', async () => {
  rows = [tx(100, 'EXPENSE', '2026-09-10')]; // só o mês anterior
  const res = await call({ month: '2026-10' });
  assert.equal(res.statusCode, 422);
});

test('busca só as transações do próprio usuário e devolve o resumo', async () => {
  rows = [tx(3000, 'INCOME', '2026-10-05'), tx(400, 'EXPENSE', '2026-10-12'), tx(300, 'EXPENSE', '2026-09-12')];
  const res = await call({ month: '2026-10' });

  assert.equal(lastWhere.userId, 'user-1');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.stats.expense, 400); // setembro não entra no total de outubro
  assert.equal(res.body.stats.previousMonth.expense, 300);
  assert.equal(res.body.ongoing, false);
  assert.equal(res.body.source, 'local');
  assert.match(res.body.summary.replace(/\u00a0/g, ' '), /Em outubro você recebeu R\$ 3\.000,00 e gastou R\$ 400,00\./);
  assert.equal(res.body.summary.split('\n\n').length, 3);
});

test('com resposta da IA, devolve o texto dela e envia só totais', async () => {
  rows = [tx(3000, 'INCOME', '2026-10-05'), tx(400, 'EXPENSE', '2026-10-12')];
  aiResult = { text: 'Texto da IA.', model: 'modelo-teste' };
  const res = await call({ month: '2026-10' });
  aiResult = null;

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.source, 'ai');
  assert.equal(res.body.summary, 'Texto da IA.');
  assert.equal(aiInput.monthLabel, 'outubro de 2026');
  // O que vai para a IA não tem descrições nem dados do usuário
  assert.doesNotMatch(JSON.stringify(aiInput), /user-1|description/);
});

test('erro no banco vira 500 com mensagem genérica', async () => {
  failNext = true;
  const res = await call({ month: '2026-10' });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'Erro ao gerar o resumo do mês.');
});
