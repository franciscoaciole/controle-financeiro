// Resumo do mês escrito por um LLM (Google Gemini), com o texto local como reserva.
//
// Regras de projeto:
// - Só totais agregados saem do servidor (nada de descrições, nomes ou e-mails).
// - Os números são calculados aqui; o modelo só redige. Se o texto citar um valor
//   em reais que não foi enviado, a resposta é descartada (proteção contra
//   "alucinação" de números) e o app usa o resumo montado por regras.
// - Qualquer falha (sem chave, timeout, erro HTTP, resposta vazia) devolve null,
//   e quem chamou cai no texto local. A IA nunca derruba o recurso.

const DEFAULT_MODEL = 'gemini-flash-lite-latest';
const TIMEOUT_MS = 8000;
const MAX_CHARS = 1500;

const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Normaliza espaços (o Intl usa espaço não separável depois de "R$")
const normalizeSpaces = (text) => text.replace(/[\u00a0\u202f]/g, ' ');

// Todos os valores em reais que o modelo pode citar, já formatados
function allowedMoneyValues(stats, localSummary) {
  const values = [
    stats.income,
    stats.expense,
    stats.balance,
    Math.abs(stats.balance),
    stats.previousMonth.income,
    stats.previousMonth.expense,
  ];
  for (const c of stats.expensesByCategory) {
    values.push(c.total, c.previousTotal);
  }
  const allowed = new Set(values.map((n) => normalizeSpaces(money(n))));
  // Valores que já aparecem no texto local também são confiáveis
  for (const m of normalizeSpaces(localSummary).match(/R\$ ?[\d.]+,\d{2}/g) || []) {
    allowed.add(m.replace(/R\$ ?/, 'R$ '));
  }
  return allowed;
}

// true se todo "R$ x,yz" do texto estiver na lista permitida
function moneyValuesAreGrounded(text, allowed) {
  const found = normalizeSpaces(text).match(/R\$ ?[\d.]+(,\d{2})?/g) || [];
  return found.every((m) => {
    const value = m.replace(/R\$ ?/, 'R$ ');
    return allowed.has(value.includes(',') ? value : `${value},00`);
  });
}

// Tira marcações de markdown e espaços extras que o modelo às vezes devolve
function cleanText(text) {
  return text
    .replace(/\*\*|__|#+\s?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildPrompt(monthLabel, stats, localSummary, ongoing) {
  const facts = {
    mes: monthLabel,
    mesEmAndamento: ongoing,
    receitas: money(stats.income),
    despesas: money(stats.expense),
    saldo: money(stats.balance),
    taxaDeEconomia: stats.savingsRate === null ? null : `${stats.savingsRate}%`,
    despesasPorCategoria: stats.expensesByCategory.map((c) => ({
      categoria: c.name,
      total: money(c.total),
      participacao: `${c.share}%`,
      mesAnterior: money(c.previousTotal),
      variacao: c.changePct === null ? null : `${c.changePct}%`,
    })),
    mesAnterior: stats.previousMonth.hasData
      ? { receitas: money(stats.previousMonth.income), despesas: money(stats.previousMonth.expense) }
      : null,
  };

  return [
    'Dados do mês (JSON):',
    JSON.stringify(facts, null, 2),
    '',
    'Resumo de referência, já conferido:',
    localSummary,
  ].join('\n');
}

const SYSTEM_INSTRUCTION = [
  'Você escreve o resumo financeiro mensal de um app brasileiro de controle de gastos.',
  'Escreva em português do Brasil, em segunda pessoa ("você"), tom próximo e direto, sem julgamentos.',
  'Use exatamente 3 parágrafos curtos separados por uma linha em branco:',
  '1) panorama de receitas, despesas e saldo; 2) destaques por categoria e comparação com o mês anterior;',
  '3) uma sugestão prática e específica para o próximo mês.',
  'Use somente os valores em reais fornecidos, copiados exatamente como estão. Não faça contas novas nem invente números.',
  'Se o mês estiver em andamento, fale em "até agora" e não compare com o mês anterior.',
  'Sem markdown, sem listas, sem emojis, sem saudação e no máximo 120 palavras.',
].join(' ');

// fetchImpl e env podem ser trocados nos testes
async function generateAiSummary(
  { monthLabel, stats, localSummary, ongoing },
  { fetchImpl = globalThis.fetch, env = process.env } = {},
) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || typeof fetchImpl !== 'function') return null;

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: buildPrompt(monthLabel, stats, localSummary, ongoing) }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`[resumo-ia] Gemini respondeu ${response.status}; usando o texto local.`);
      return null;
    }

    const data = await response.json();
    const raw = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('');
    const text = cleanText(raw);

    if (!text || text.length > MAX_CHARS) return null;

    if (!moneyValuesAreGrounded(text, allowedMoneyValues(stats, localSummary))) {
      console.warn('[resumo-ia] Texto citou valor fora dos dados; usando o texto local.');
      return null;
    }

    return { text, model };
  } catch (error) {
    console.warn(`[resumo-ia] Falha ao chamar o Gemini (${error.name}); usando o texto local.`);
    return null;
  }
}

module.exports = {
  generateAiSummary,
  // exportados para teste
  moneyValuesAreGrounded,
  allowedMoneyValues,
  cleanText,
};
