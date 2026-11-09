const prisma = require('../lib/prisma');
const {
  parseMonth,
  currentMonthKey,
  buildMonthStats,
  buildPrompt,
  SYSTEM_PROMPT,
} = require('../lib/monthSummary');
const { generateText, AiError } = require('../services/anthropic');

// POST /insights/month  { "month": "2026-10" }  (sem month = mês atual)
async function monthInsight(req, res) {
  const userId = req.userId;
  const monthKey = req.body?.month ?? currentMonthKey();
  const range = parseMonth(monthKey);

  if (!range) {
    return res.status(400).json({ error: 'Mês inválido. Use o formato AAAA-MM.' });
  }

  try {
    // Mês pedido + mês anterior em uma consulta só
    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: range.prevStart, lt: range.end } },
      select: {
        amount: true,
        date: true,
        category: { select: { name: true, type: true } },
      },
    });

    const current = transactions.filter((t) => t.date >= range.start);
    const previous = transactions.filter((t) => t.date < range.start);

    if (current.length === 0) {
      return res.status(422).json({ error: 'Não há transações nesse mês para resumir.' });
    }

    const stats = buildMonthStats(current, previous);
    const summary = await generateText({
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(monthKey, stats),
    });

    return res.status(200).json({ month: monthKey, summary, stats });
  } catch (error) {
    if (error instanceof AiError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar o resumo do mês.' });
  }
}

module.exports = { monthInsight };
