const test = require('node:test');
const assert = require('node:assert/strict');

const { generateAiSummary, moneyValuesAreGrounded, allowedMoneyValues, cleanText } = require('../src/lib/aiSummary');
const { buildMonthStats, buildSummaryText } = require('../src/lib/monthSummary');

const tx = (amount, type, name, date) => ({
  amount,
  date: new Date(`${date}T00:00:00Z`),
  category: { name, type },
});

const stats = buildMonthStats(
  [tx(3000, 'INCOME', 'Salário', '2026-10-05'), tx(400, 'EXPENSE', 'Alimentação', '2026-10-12')],
  [tx(300, 'EXPENSE', 'Alimentação', '2026-09-12')],
);
const localSummary = buildSummaryText('2026-10', stats);
const input = { monthLabel: 'outubro de 2026', stats, localSummary, ongoing: false };
const env = { GEMINI_API_KEY: 'chave-de-teste' };

const geminiReply = (text, ok = true, status = 200) => async () => ({
  ok,
  status,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

test('sem chave configurada não chama a rede e devolve null', async () => {
  let called = false;
  const result = await generateAiSummary(input, { env: {}, fetchImpl: async () => { called = true; } });
  assert.equal(result, null);
  assert.equal(called, false);
});

test('usa o texto do modelo quando os valores batem com os dados', async () => {
  const text = 'Em outubro você recebeu R$ 3.000,00 e gastou R$ 400,00.\n\nAlimentação somou R$ 400,00.\n\nSepare uma parte da renda.';
  const result = await generateAiSummary(input, { env, fetchImpl: geminiReply(text) });
  assert.equal(result.text, text);
  assert.equal(result.model, 'gemini-flash-lite-latest');
});

test('envia a chave no cabeçalho e só totais no corpo', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return geminiReply('Tudo certo.')();
  };
  await generateAiSummary(input, { env: { ...env, GEMINI_MODEL: 'outro-modelo' }, fetchImpl });
  assert.match(request.url, /models\/outro-modelo:generateContent$/);
  assert.equal(request.options.headers['x-goog-api-key'], 'chave-de-teste');
  assert.doesNotMatch(request.url, /chave-de-teste/); // a chave não vai na URL
});

test('descarta o texto se citar valor que não está nos dados', async () => {
  const text = 'Você gastou R$ 999,00 com Alimentação.';
  const result = await generateAiSummary(input, { env, fetchImpl: geminiReply(text) });
  assert.equal(result, null);
});

test('erro HTTP, exceção e resposta vazia caem no texto local (null)', async () => {
  assert.equal(await generateAiSummary(input, { env, fetchImpl: geminiReply('x', false, 429) }), null);
  assert.equal(await generateAiSummary(input, { env, fetchImpl: async () => { throw new Error('timeout'); } }), null);
  assert.equal(await generateAiSummary(input, { env, fetchImpl: geminiReply('   ') }), null);
});

test('checagem de valores aceita formatos com e sem espaço e sem centavos', () => {
  const allowed = allowedMoneyValues(stats, localSummary);
  assert.equal(moneyValuesAreGrounded('Gastou R$400,00 e recebeu R$ 3.000', allowed), true);
  assert.equal(moneyValuesAreGrounded('Sobraram R$ 2.600,00', allowed), true); // saldo
  assert.equal(moneyValuesAreGrounded('Gastou R$ 401,00', allowed), false);
});

test('remove markdown do texto do modelo', () => {
  assert.equal(cleanText('## Resumo\n**Você** gastou.\n\n\n\nFim.'), 'Resumo\nVocê gastou.\n\nFim.');
});
