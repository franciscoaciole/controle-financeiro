// Funções puras do "Resumo do mês": não acessam banco nem rede,
// por isso dá para testar tudo com node --test.
// O texto é montado aqui mesmo, a partir dos totais: sem IA, sem custo e sem
// enviar dados para fora do servidor.

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

// Só números agregados: nenhuma descrição de transação entra no resumo.
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

// ---- Texto do resumo ----

// O Intl já põe um espaço não separável entre "R$" e o número:
// ele é mantido de propósito, para o valor nunca quebrar em duas linhas.
const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const pct = (n) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

function monthName(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    timeZone: 'UTC',
  });
}

function previousMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Categoria com o maior aumento em reais em relação ao mês anterior
function biggestIncrease(stats) {
  let best = null;
  for (const c of stats.expensesByCategory) {
    if (c.changePct === null || c.changePct <= 0) continue;
    const diff = c.total - c.previousTotal;
    if (!best || diff > best.total - best.previousTotal) best = c;
  }
  return best;
}

// ongoing = o mês ainda não terminou (mês atual): o texto fala em "até agora"
function overviewParagraph(monthKey, stats, ongoing) {
  const parts = [];
  const name = monthName(monthKey);
  const opening = ongoing ? `Até agora, em ${name}, você` : `Em ${name} você`;

  if (stats.income > 0 && stats.expense > 0) {
    parts.push(`${opening} recebeu ${money(stats.income)} e gastou ${money(stats.expense)}.`);
  } else if (stats.income > 0) {
    parts.push(`${opening} recebeu ${money(stats.income)} e não registrou despesas.`);
  } else {
    parts.push(`${opening} gastou ${money(stats.expense)} e não registrou receitas.`);
  }

  if (stats.income > 0 && stats.balance >= 0) {
    parts.push(
      ongoing
        ? `Por enquanto sobram ${money(stats.balance)}, ou ${pct(stats.savingsRate)} da renda.`
        : `Sobraram ${money(stats.balance)}, ou ${pct(stats.savingsRate)} da renda.`,
    );
  } else if (stats.income > 0) {
    parts.push(
      ongoing
        ? `Por enquanto as despesas passam as receitas em ${money(-stats.balance)}.`
        : `As despesas passaram as receitas em ${money(-stats.balance)}.`,
    );
  }

  return parts.join(' ');
}

function highlightsParagraph(monthKey, stats, ongoing) {
  const top = stats.expensesByCategory[0];
  if (!top) {
    return ongoing
      ? 'Ainda não há despesas registradas neste mês.'
      : 'Não houve despesas no mês, então não há destaques de gastos.';
  }

  const parts = [
    ongoing
      ? `O maior gasto até agora é ${top.name}, com ${money(top.total)} (${pct(top.share)} das despesas).`
      : `O maior gasto foi ${top.name}, com ${money(top.total)} (${pct(top.share)} das despesas).`,
  ];

  // Comparar alguns dias com um mês inteiro daria quedas enganosas
  // (ex.: "caíram 97%"); a comparação só aparece com o mês fechado.
  if (ongoing) {
    parts.push('A comparação com o mês anterior aparece quando o mês terminar.');
    return parts.join(' ');
  }

  const prev = stats.previousMonth;
  if (!prev.hasData) {
    parts.push('Não há transações no mês anterior para comparar.');
    return parts.join(' ');
  }

  const prevName = monthName(previousMonthKey(monthKey));
  if (prev.expense > 0) {
    const change = round2(((stats.expense - prev.expense) / prev.expense) * 100);
    if (change > 0) {
      parts.push(`No total, as despesas subiram ${pct(change)} em relação a ${prevName}.`);
    } else if (change < 0) {
      parts.push(`No total, as despesas caíram ${pct(-change)} em relação a ${prevName}.`);
    } else {
      parts.push(`No total, as despesas ficaram iguais às de ${prevName}.`);
    }
  }

  const increase = biggestIncrease(stats);
  if (increase) {
    parts.push(
      `O maior aumento foi em ${increase.name}: de ${money(increase.previousTotal)} para ${money(increase.total)}.`,
    );
  }

  return parts.join(' ');
}

function suggestionParagraph(stats, ongoing) {
  const top = stats.expensesByCategory[0];
  const increase = ongoing ? null : biggestIncrease(stats);
  const when = ongoing ? 'Até o fim do mês' : 'Para o próximo mês';

  if (!top) {
    return `${when}, continue registrando receitas e despesas para acompanhar a evolução.`;
  }
  // Sem receita lançada não dá para dizer que o mês "fechou no vermelho":
  // o mais provável é a renda só não ter sido registrada.
  if (stats.income === 0) {
    return `${when}, registre também suas receitas para ver quanto sobra depois dos gastos.`;
  }
  if (stats.balance < 0) {
    return `${when}, vale rever os gastos com ${top.name}, a categoria que mais pesou, para fechar no azul.`;
  }
  if (increase && increase.changePct >= 20) {
    return `Para o próximo mês, vale acompanhar ${increase.name}, que teve o maior aumento.`;
  }
  if (stats.savingsRate !== null && stats.savingsRate < 10) {
    return ongoing
      ? 'Até o fim do mês, tente separar uma parte da renda antes dos próximos gastos.'
      : 'Para o próximo mês, tente separar uma parte da renda logo que ela entrar, antes dos gastos.';
  }
  if (top.share >= 50) {
    return ongoing
      ? `${when}, vale acompanhar ${top.name}, que já concentra mais da metade dos gastos.`
      : `${top.name} concentrou mais da metade dos gastos. Um teto para essa categoria pode ajudar no próximo mês.`;
  }
  return ongoing
    ? 'Até o fim do mês, mantenha o ritmo e continue registrando seus gastos.'
    : 'Bom mês: mantenha o ritmo e continue registrando seus gastos para comparar no próximo mês.';
}

// 3 parágrafos separados por linha em branco: panorama, destaques e sugestão.
// ongoing: true quando o mês ainda está em andamento (mês atual).
function buildSummaryText(monthKey, stats, { ongoing = false } = {}) {
  return [
    overviewParagraph(monthKey, stats, ongoing),
    highlightsParagraph(monthKey, stats, ongoing),
    suggestionParagraph(stats, ongoing),
  ].join('\n\n');
}

module.exports = {
  parseMonth,
  currentMonthKey,
  buildMonthStats,
  buildSummaryText,
};
