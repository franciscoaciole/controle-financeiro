import { suggestCategory, normalize } from './categorySuggestion.js';

// Leitura de extratos bancários (OFX e CSV) no próprio navegador.
// Tudo aqui é função pura: recebe texto, devolve lançamentos prontos para a prévia.

export const MAX_ROWS = 500;

// ---------- Utilidades ----------

// Arquivos de banco costumam vir em UTF-8 ou Windows-1252: tenta UTF-8 e, se falhar, usa o outro
export function decodeStatementBytes(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

function isRealDate(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

function iso(y, m, d) {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Aceita 2026-10-25, 25/10/2026, 25-10-26, 25.10.2026 e 20261025[...] (OFX)
export function parseStatementDate(raw) {
  const s = String(raw ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return isRealDate(+m[1], +m[2], +m[3]) ? iso(+m[1], +m[2], +m[3]) : null;

  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return isRealDate(year, +m[2], +m[1]) ? iso(year, +m[2], +m[1]) : null;
  }

  m = s.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return isRealDate(+m[1], +m[2], +m[3]) ? iso(+m[1], +m[2], +m[3]) : null;

  return null;
}

// Número com sinal no padrão brasileiro: "-1.234,56", "R$ 25,90", "(25,90)", "25,90 D", "25,90-"
export function parseSignedAmount(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return NaN;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/r\$/gi, '').replace(/\s+/g, '');
  if (/[dD]$/.test(s)) {
    negative = true;
    s = s.slice(0, -1);
  } else if (/[cC]$/.test(s)) {
    s = s.slice(0, -1);
  }
  if (s.endsWith('-')) {
    negative = true;
    s = s.slice(0, -1);
  }
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }
  if (!/^\d[\d.,]*$/.test(s)) return NaN;

  if (s.includes(',') && s.includes('.')) {
    // o último separador é o decimal
    const decimalIsComma = s.lastIndexOf(',') > s.lastIndexOf('.');
    s = decimalIsComma ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ''); // "1.250" = mil duzentos e cinquenta
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return negative ? -n : n;
}

function cleanDescription(text) {
  const d = String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 100).trim();
  return d || 'Sem descrição';
}

function isBalanceLine(description) {
  return normalize(description).replace(/\s+/g, ' ').startsWith('saldo');
}

function makeRow(index, date, description, signed, invert) {
  const amount = Math.round(Math.abs(signed) * 100) / 100;
  const expense = invert ? signed > 0 : signed < 0;
  return { id: index, date, description, amount, kind: expense ? 'EXPENSE' : 'INCOME' };
}

// ---------- OFX ----------

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseOfx(text) {
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const rows = [];
  let skipped = 0;

  for (const block of blocks) {
    const field = (tag) => {
      const m = block.match(new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, 'i'));
      return m ? decodeEntities(m[1].trim()) : '';
    };

    const date = parseStatementDate(field('DTPOSTED'));
    // No OFX o decimal é sempre ponto; vírgula só aparece em arquivos fora do padrão
    const signed = Number(field('TRNAMT').replace(',', '.'));
    const description = cleanDescription(field('MEMO') || field('NAME'));

    if (!date || !Number.isFinite(signed) || signed === 0) {
      skipped += 1;
      continue;
    }
    rows.push(makeRow(rows.length, date, description, signed, false));
  }

  return { rows, skipped };
}

// ---------- CSV ----------

// Divide o texto em linhas e campos respeitando aspas
function splitCsv(text, delimiter) {
  const lines = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      lines.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field);
  lines.push(row);

  return lines.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function detectDelimiter(text) {
  const sample = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 8);
  const count = (ch) =>
    sample.reduce((sum, line) => sum + line.replace(/"[^"]*"/g, '').split(ch).length - 1, 0);
  const scores = [';', ',', '\t'].map((d) => ({ d, n: count(d) }));
  scores.sort((a, b) => b.n - a.n);
  return scores[0].n > 0 ? scores[0].d : ';';
}

const DATE_HEADER = /^(data|date|dt)\b/;
const DESC_HEADER = /(descricao|historico|lancamento|estabelecimento|title|memo|detalhe|nome)/;
const AMOUNT_HEADER = /^(valor|value|amount|quantia)\b/;
const DEBIT_HEADER = /(debito|saida|retirada)/;
const CREDIT_HEADER = /(credito|entrada|deposito)/;

function findHeader(lines) {
  for (let i = 0; i < Math.min(lines.length, 30); i += 1) {
    const cells = lines[i].map((c) => normalize(c).trim());
    const date = cells.findIndex((c) => DATE_HEADER.test(c));
    if (date < 0) continue;

    const desc = cells
      .map((c, idx) => (idx !== date && DESC_HEADER.test(c) ? idx : -1))
      .filter((idx) => idx >= 0);
    const amount = cells.findIndex((c) => AMOUNT_HEADER.test(c));
    const debit = cells.findIndex((c, idx) => idx !== date && DEBIT_HEADER.test(c));
    const credit = cells.findIndex((c, idx) => idx !== date && CREDIT_HEADER.test(c));

    const hasAmount = amount >= 0 || (debit >= 0 && credit >= 0);
    if (desc.length > 0 && hasAmount) {
      // Fatura de cartão (colunas date, category, title, amount): valor positivo é gasto
      const cardStyle = cells.includes('title') && cells.includes('category');
      return { index: i, date, desc, amount, debit, credit, cardStyle };
    }
  }
  return null;
}

function parseCsv(text) {
  const lines = splitCsv(text, detectDelimiter(text));
  const header = findHeader(lines);
  if (!header) return null;

  const rows = [];
  let skipped = 0;

  for (const cells of lines.slice(header.index + 1)) {
    const date = parseStatementDate(cells[header.date]);

    const parts = header.desc
      .map((idx) => String(cells[idx] ?? '').trim())
      .filter((v, i, arr) => v && arr.indexOf(v) === i);
    const description = cleanDescription(parts.join(' - '));

    let signed = NaN;
    if (header.amount >= 0) {
      signed = parseSignedAmount(cells[header.amount]);
    } else {
      const debit = Math.abs(parseSignedAmount(cells[header.debit]));
      const credit = Math.abs(parseSignedAmount(cells[header.credit]));
      if (debit > 0) signed = -debit;
      else if (credit > 0) signed = credit;
    }

    if (!date || !Number.isFinite(signed) || signed === 0 || isBalanceLine(description)) {
      skipped += 1;
      continue;
    }
    rows.push(makeRow(rows.length, date, description, signed, header.cardStyle));
  }

  return { rows, skipped };
}

// ---------- Entrada principal ----------

export function parseStatement(text) {
  const clean = String(text ?? '').replace(/^\uFEFF/, '');
  if (!clean.trim()) return { ok: false, message: 'O arquivo está vazio.' };

  const isOfx = /<OFX|<STMTTRN>/i.test(clean);
  const parsed = isOfx ? parseOfx(clean) : parseCsv(clean);

  if (!parsed) {
    return {
      ok: false,
      message:
        'Não reconheci as colunas. O arquivo precisa ter data, descrição e valor (ou débito e crédito).',
    };
  }
  if (parsed.rows.length === 0) {
    return { ok: false, message: 'Nenhum lançamento válido foi encontrado no arquivo.' };
  }
  if (parsed.rows.length > MAX_ROWS) {
    return {
      ok: false,
      message: `O arquivo tem ${parsed.rows.length} lançamentos. O limite é ${MAX_ROWS} por vez: exporte um período menor.`,
    };
  }

  return { ok: true, format: isOfx ? 'ofx' : 'csv', rows: parsed.rows, skipped: parsed.skipped };
}

// ---------- Prévia: categorias, duplicadas e seleção ----------

function duplicateKey(date, amount, description) {
  return `${String(date).slice(0, 10)}|${Number(amount).toFixed(2)}|${normalize(description).trim()}`;
}

// Monta as linhas exibidas na prévia a partir do que veio do arquivo e das escolhas do usuário.
// Não guarda estado: o componente só mantém `inverted`, `overrides` e `selection`.
export function deriveRows({
  baseRows,
  inverted = false,
  categories,
  existing = [],
  overrides = {},
  selection = {},
}) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // Cada lançamento já existente "consome" uma linha igual do arquivo
  const remaining = new Map();
  for (const t of existing) {
    const key = duplicateKey(t.date, t.amount, t.description);
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }

  return baseRows.map((row) => {
    const kind = inverted ? (row.kind === 'INCOME' ? 'EXPENSE' : 'INCOME') : row.kind;

    const matches = (id) => categoryById.get(id)?.type === kind;
    const chosen = overrides[row.id];
    let categoryId = chosen && matches(chosen) ? chosen : '';
    if (!categoryId) {
      const suggested = suggestCategory(row.description, categories);
      categoryId = suggested && matches(suggested) ? suggested : '';
    }

    const key = duplicateKey(row.date, row.amount, row.description);
    const left = remaining.get(key) || 0;
    const duplicate = left > 0;
    if (duplicate) remaining.set(key, left - 1);

    const selected = selection[row.id] ?? !duplicate;
    return { ...row, kind, categoryId, duplicate, selected };
  });
}

// Ao escolher a categoria de uma linha, repete a escolha nas outras sem categoria e com a mesma descrição
export function propagateCategory(rows, rowId, categoryId, overrides) {
  const target = rows.find((r) => r.id === rowId);
  if (!target) return overrides;

  const next = { ...overrides, [rowId]: categoryId };
  const sameText = normalize(target.description).trim();
  for (const r of rows) {
    if (r.id !== rowId && !r.categoryId && normalize(r.description).trim() === sameText) {
      next[r.id] = categoryId;
    }
  }
  return next;
}

// Só importa o que está marcado e tem categoria
export function rowsToPayload(rows) {
  return rows
    .filter((r) => r.selected && r.categoryId)
    .map((r) => ({
      description: r.description,
      amount: r.amount,
      date: r.date,
      categoryId: r.categoryId,
    }));
}
