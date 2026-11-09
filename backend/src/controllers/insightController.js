const prisma = require('../lib/prisma');
const {
  parseMonth,
  currentMonthKey,
  buildMonthStats,
  buildSummaryText,
} = require('../lib/monthSummary');
const { generateAiSummary } = require('../lib/aiSummary');

// "2026-10" -> "outubro de 2026"
function monthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

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
    // Mês atual (ou futuro) ainda não fechou: o texto fala em "até agora"
    const ongoing = monthKey >= currentMonthKey();
    const localSummary = buildSummaryText(monthKey, stats, { ongoing });

    // A IA só redige a partir dos totais; se falhar, o texto local é a resposta
    const ai = await generateAiSummary({
      monthLabel: monthLabel(monthKey),
      stats,
      localSummary,
      ongoing,
    });

    return res.status(200).json({
      month: monthKey,
      ongoing,
      summary: ai ? ai.text : localSummary,
      source: ai ? 'ai' : 'local',
      stats,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar o resumo do mês.' });
  }
}

module.exports = { monthInsight };
