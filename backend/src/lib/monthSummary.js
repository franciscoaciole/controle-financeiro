// Funções puras do "Resumo do mês com IA": não acessam banco nem rede,
// por isso dá para testar tudo com node --test.

const MONTH_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

// "2026-10" -> { start: 2026-10-01, end: 2026-11-01, prevStart: 2026-09-01 } (UTC)
// As datas do app são gravadas como dia de calendário em UTC.
function parseMonth(value) {
  if (typeof value !== 'string') return null;
  const match = MONTH_REGEX.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (year < 2000 || year > 2100) return null;

  return {
    key: value,
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
    prevStart: new Date(Date.UTC(year, monthIndex - 1, 1)),
  };
}

function currentMonthKey(now = new Date()) {
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${now.getUTCFullYear()}-${month}`;
}

const round2 = (n) => Math.round(n * 100) / 100;

function totals(transactions) {
  let income = 0;
  let expense = 0;
  const byCategory = {};

  for (const t of transactions) {
    const amount = Number(t.amount);
    if (t.category.type === 'INCOME') {
      income += amount;
    } else if (t.category.type === 'EXPENSE') {
      expense += amount;
      byCategory[t.category.name] = (byCategory[t.category.name] || 0) + amount;
    }
  }

  return { income, expense, byCategory };
}

// Monta só números agregados: nenhuma descrição de transação sai do servidor.
function buildMonthStats(monthTransactions, previousTransactions) {
  const current = totals(monthTransactions);
  const previous = totals(previousTransactions);

  const expensesByCategory = Object.entries(current.byCategory)
    .map(([name, total]) => {
      const before = previous.byCategory[name] || 0;
      return {
        name,
        total: round2(total),
        share: current.expense > 0 ? round2((total / current.expense) * 100) : 0,
        previousTotal: round2(before),
        changePct: before > 0 ? round2(((total - before) / before) * 100) : null,
      };
    })
    .sort((a, b) => b.total - a.total);

  const savingsRate =
    current.income > 0
      ? round2(((current.income - current.expense) / current.income) * 100)
      : null;

  return {
    transactionCount: monthTransactions.length,
    income: round2(current.income),
    expense: round2(current.expense),
    balance: round2(current.income - current.expense),
    savingsRate,
    expensesByCategory,
    previousMonth: {
      hasData: previousTransactions.length > 0,
      income: round2(previous.income),
      expense: round2(previous.expense),
    },
  };
}

const SYSTEM_PROMPT = `Você é o assistente do Finan+, um app de controle de finanças pessoais.
Escreva um resumo do mês em português do Brasil para o próprio usuário, a partir dos dados em JSON.

Regras:
- Use somente os números fornecidos. Não invente valores, categorias nem motivos.
- Valores em reais no formato R$ 1.234,56.
- Exatamente 3 parágrafos curtos, separados por uma linha em branco, sem títulos, listas ou markdown:
  1) como foi o mês (receitas, despesas, saldo e, se houver, quanto sobrou da renda);
  2) o principal destaque dos gastos (categoria que mais pesou e, se houver mês anterior, a maior variação);
  3) uma sugestão prática e realista para o próximo mês.
- Tom direto e amigável, sem julgamentos. No máximo 110 palavras no total.
- Não recomende investimentos, produtos financeiros nem empresas.`;

function buildPrompt(monthKey, stats) {
  return `Mês: ${monthKey}\nDados:\n${JSON.stringify(stats, null, 2)}`;
}

module.exports = {
  parseMonth,
  currentMonthKey,
  buildMonthStats,
  buildPrompt,
  SYSTEM_PROMPT,
};
