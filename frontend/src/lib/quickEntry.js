import { suggestCategory } from './categorySuggestion.js';
import { toISODate } from './dates.js';

// Interpreta uma frase como "uber 25,90 ontem" e devolve os campos de uma transação.
// Função pura: recebe o texto, as categorias do usuário e (opcional) a data de "hoje".

const AMOUNT_RE =
  /(r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(\s*(?:reais|real)\b)?/gi;
const FULL_DATE_RE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?(?!\d)/;
const DAY_RE = /\bdia\s+(\d{1,2})\b/i;
const RELATIVE_RE = /\b(anteontem|ontem|hoje)\b/i;

const LEADING_VERBS_RE = /^(gastei|paguei|comprei|recebi|ganhei)\s+/i;
const LEADING_PREPOSITION_RE = /^(de|do|da|no|na|em|com|pro|pra|para)\s+/i;

// "1.250,50" -> 1250.5 | "25,90" -> 25.9 | "25.90" -> 25.9 | "1.250" -> 1250
function parseAmount(raw) {
  let value = raw;
  if (value.includes(',')) {
    value = value.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    value = value.replace(/\./g, '');
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

// Cria a data só se ela existir de verdade (31/02 não vale)
function buildDate(year, month, day) {
  const d = new Date(year, month - 1, day);
  const valid =
    d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  return valid ? d : null;
}

// Procura a data no texto. Devolve { date, text sem a data } ou erro.
function extractDate(text, now) {
  const relative = text.match(RELATIVE_RE);
  if (relative) {
    const offset = { hoje: 0, ontem: 1, anteontem: 2 }[relative[1].toLowerCase()];
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    return { date: d, rest: text.replace(RELATIVE_RE, ' ') };
  }

  const full = text.match(FULL_DATE_RE);
  if (full) {
    const day = Number(full[1]);
    const month = Number(full[2]);
    let year = now.getFullYear();
    if (full[3]) year = full[3].length === 2 ? 2000 + Number(full[3]) : Number(full[3]);
    const d = buildDate(year, month, day);
    if (!d) return { error: 'Data inválida.' };
    return { date: d, rest: text.replace(FULL_DATE_RE, ' ') };
  }

  const dayOnly = text.match(DAY_RE);
  if (dayOnly) {
    const day = Number(dayOnly[1]);
    // "dia 28" dito no dia 5 quase sempre é do mês anterior
    let month = now.getMonth() + 1;
    let year = now.getFullYear();
    if (day > now.getDate()) {
      month -= 1;
      if (month === 0) {
        month = 12;
        year -= 1;
      }
    }
    const d = buildDate(year, month, day);
    if (!d) return { error: 'Data inválida.' };
    return { date: d, rest: text.replace(DAY_RE, ' ') };
  }

  return { date: new Date(now.getFullYear(), now.getMonth(), now.getDate()), rest: text };
}

// Escolhe o valor: o marcado com "R$"/"reais" ou, se não houver, o último número
function extractAmount(text) {
  const matches = [...text.matchAll(AMOUNT_RE)];
  if (matches.length === 0) return null;

  const marked = matches.find((m) => m[1] || m[3]);
  const chosen = marked || matches[matches.length - 1];
  const amount = parseAmount(chosen[2]);
  if (!(amount > 0)) return null;

  const rest = text.slice(0, chosen.index) + ' ' + text.slice(chosen.index + chosen[0].length);
  return { amount, rest };
}

function cleanDescription(text) {
  let d = text.replace(/\s+/g, ' ').trim();
  d = d.replace(LEADING_VERBS_RE, '');
  d = d.replace(LEADING_PREPOSITION_RE, '');
  d = d.replace(/[\s,;:\-–]+$/g, '').replace(/^[\s,;:\-–]+/g, '').trim();
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export function parseQuickEntry(input, categories = [], now = new Date()) {
  const text = (input || '').trim();
  if (!text) return { ok: false, reason: 'empty' };

  const dateResult = extractDate(text, now);
  if (dateResult.error) return { ok: false, reason: 'date', message: dateResult.error };

  const amountResult = extractAmount(dateResult.rest);
  if (!amountResult) {
    return { ok: false, reason: 'amount', message: 'Inclua o valor, ex.: uber 25,90 ontem' };
  }

  const description = cleanDescription(amountResult.rest);
  if (!description) {
    return { ok: false, reason: 'description', message: 'Inclua uma descrição, ex.: uber 25,90' };
  }

  return {
    ok: true,
    entry: {
      description,
      amount: amountResult.amount,
      date: toISODate(dateResult.date),
      categoryId: suggestCategory(description, categories) || '',
    },
  };
}
