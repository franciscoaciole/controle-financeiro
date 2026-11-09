// Chamada à API da Anthropic usando o fetch nativo do Node (sem dependência nova).
// A chave fica só no servidor: o navegador nunca vê a ANTHROPIC_API_KEY.

const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-5-5';

class AiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AiError';
    this.status = status;
  }
}

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function generateText({ system, prompt, maxTokens = 600 }) {
  if (!isConfigured()) {
    throw new AiError('Resumo com IA não está configurado no servidor.', 503);
  }

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
      // Sem resposta em 25 s, desiste (o usuário não fica esperando para sempre)
      signal: AbortSignal.timeout(25000),
    });
  } catch (error) {
    console.error('Falha ao chamar a API da Anthropic:', error.name);
    throw new AiError('A IA demorou para responder. Tente de novo.', 504);
  }

  if (!response.ok) {
    // O corpo do erro vai só para o log, nunca para o usuário
    const detail = await response.text().catch(() => '');
    console.error(`API da Anthropic respondeu ${response.status}: ${detail.slice(0, 300)}`);
    throw new AiError('Não foi possível gerar o resumo agora. Tente mais tarde.', 502);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new AiError('A IA não retornou um resumo. Tente de novo.', 502);
  }
  return text;
}

module.exports = { generateText, isConfigured, AiError };
