const MAX_AMOUNT = 999999999.99;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // o bcrypt só considera os 72 primeiros caracteres
const VALID_TYPES = ['INCOME', 'EXPENSE'];

// Transações
function parseDescription(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > 100) return null;
  return text;
}

function parseAmount(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_AMOUNT) return null;
  return Math.round(n * 100) / 100; // 2 casas decimais
}

function parseDate(value) {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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
  MAX_PASSWORD,
  VALID_TYPES,
  parseDescription,
  parseAmount,
  parseDate,
  parseCategoryName,
  parseRegister,
};
