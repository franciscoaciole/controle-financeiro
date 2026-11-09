// A coluna amount é Decimal(10, 2): no máximo 8 dígitos antes da vírgula.
// Acima disso o banco recusa e a API respondia 500 em vez de 400.
const MAX_AMOUNT = 99999999.99;
const AMOUNT_RANGE_TEXT = 'R$ 0,01 e R$ 99.999.999,99';
// Tetos por usuário: sem eles, uma conta sozinha conseguia encher o banco
// (o plano gratuito do Neon tem 1 GB) importando 500 linhas por vez.
const MAX_TRANSACTIONS_PER_USER = 20000;
const MAX_CATEGORIES_PER_USER = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // o bcrypt só considera os 72 primeiros caracteres
const VALID_TYPES = ['INCOME', 'EXPENSE'];
const MAX_IMPORT = 500; // lançamentos por importação
const MIN_YEAR = 2000; // faixa aceita para datas de transação
const MAX_YEAR = 2100;

// Transações
function parseDescription(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > 100) return null;
  return text;
}

function parseAmount(value) {
  let n;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    const text = value.trim();
    // só dígitos com ponto decimal opcional: recusa "1e3", "-5", "0x10", "Infinity"
    if (!/^\d+(\.\d+)?$/.test(text)) return null;
    n = Number(text);
  } else {
    return null;
  }
  if (!Number.isFinite(n)) return null;

  // arredonda ANTES de checar o mínimo: 0,001 viraria R$ 0,00
  const rounded = Math.round(n * 100) / 100;
  if (rounded < 0.01 || rounded > MAX_AMOUNT) return null;
  return rounded;
}

// Aceita só AAAA-MM-DD (com horário ISO opcional), confere se o dia existe
// e limita a faixa de anos. new Date() sozinho aceitava "1" (ano 2001) e
// transformava 31/02 em 03/03 sem avisar.
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;

function parseDate(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const match = text.match(DATE_RE);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < MIN_YEAR || year > MAX_YEAR) return null;

  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Importação de extrato: valida o lote inteiro antes de gravar qualquer linha
function parseImportBatch(body) {
  const list = body && body.transactions;
  if (!Array.isArray(list) || list.length === 0) {
    return { error: 'Envie ao menos uma transação para importar.' };
  }
  if (list.length > MAX_IMPORT) {
    return { error: `Máximo de ${MAX_IMPORT} transações por importação.` };
  }

  const data = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i] || {};
    const line = i + 1;

    const description = parseDescription(item.description);
    if (!description) return { error: `Linha ${line}: descrição inválida (até 100 caracteres).` };

    const amount = parseAmount(item.amount);
    if (amount === null) return { error: `Linha ${line}: o valor deve estar entre ${AMOUNT_RANGE_TEXT}.` };

    const date = parseDate(item.date);
    if (!date) return { error: `Linha ${line}: data inválida.` };

    if (typeof item.categoryId !== 'string' || !item.categoryId) {
      return { error: `Linha ${line}: categoria é obrigatória.` };
    }

    data.push({ description, amount, date, categoryId: item.categoryId });
  }

  return { data };
}

// Categorias
function parseCategoryName(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > 40) return null;
  return text;
}

// Cadastro
function parseRegister(body) {
  const { name, email, password } = body || {};

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Nome, email e senha são obrigatórios.' };
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanName.length < 2 || cleanName.length > 60) {
    return { error: 'O nome deve ter entre 2 e 60 caracteres.' };
  }
  if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
    return { error: 'Informe um email válido.' };
  }
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return { error: `A senha deve ter entre ${MIN_PASSWORD} e ${MAX_PASSWORD} caracteres.` };
  }

  return { data: { name: cleanName, email: cleanEmail, password } };
}

module.exports = {
  MAX_AMOUNT,
  AMOUNT_RANGE_TEXT,
  MAX_PASSWORD,
  VALID_TYPES,
  MAX_IMPORT,
  MAX_TRANSACTIONS_PER_USER,
  MAX_CATEGORIES_PER_USER,
  parseDescription,
  parseAmount,
  parseDate,
  parseCategoryName,
  parseImportBatch,
  parseRegister,
};
