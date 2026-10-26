import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickEntry } from '../src/lib/quickEntry.js';

// "Hoje" fixo: 26/10/2026
const NOW = new Date(2026, 9, 26);

const categories = [
  { id: 'c-sal', name: 'Salário', type: 'INCOME' },
  { id: 'c-ali', name: 'Alimentação', type: 'EXPENSE' },
  { id: 'c-tra', name: 'Transporte', type: 'EXPENSE' },
  { id: 'c-ent', name: 'Entretenimento', type: 'EXPENSE' },
];

const parse = (text) => parseQuickEntry(text, categories, NOW);

test('exemplo principal: uber 25,90 ontem', () => {
  const r = parse('uber 25,90 ontem');
  assert.equal(r.ok, true);
  assert.deepEqual(r.entry, {
    description: 'Uber',
    amount: 25.9,
    date: '2026-10-25',
    categoryId: 'c-tra',
  });
});

test('sem data usa hoje', () => {
  assert.equal(parse('mercado 120').entry.date, '2026-10-26');
});

test('anteontem e hoje', () => {
  assert.equal(parse('padaria 8,50 anteontem').entry.date, '2026-10-24');
  assert.equal(parse('padaria 8,50 hoje').entry.date, '2026-10-26');
});

test('data dd/mm e dd/mm/aaaa', () => {
  assert.equal(parse('netflix 55,90 15/10').entry.date, '2026-10-15');
  assert.equal(parse('netflix 55,90 15/10/2025').entry.date, '2025-10-15');
  assert.equal(parse('netflix 55,90 15/10/25').entry.date, '2025-10-15');
});

test('"dia N": passado no mês atual, futuro vira mês anterior', () => {
  assert.equal(parse('mercado 80 dia 10').entry.date, '2026-10-10');
  assert.equal(parse('mercado 80 dia 28').entry.date, '2026-09-28');
});

test('"dia N" em janeiro cai em dezembro do ano anterior', () => {
  const r = parseQuickEntry('mercado 80 dia 28', categories, new Date(2027, 0, 5));
  assert.equal(r.entry.date, '2026-12-28');
});

test('data inexistente é recusada', () => {
  const r = parse('mercado 80 31/02');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'date');
});

test('formatos de valor', () => {
  assert.equal(parse('mercado 25,90').entry.amount, 25.9);
  assert.equal(parse('mercado 25.90').entry.amount, 25.9);
  assert.equal(parse('mercado 1.250,50').entry.amount, 1250.5);
  assert.equal(parse('mercado 1.250').entry.amount, 1250);
  assert.equal(parse('mercado R$ 30').entry.amount, 30);
  assert.equal(parse('mercado 30 reais').entry.amount, 30);
});

test('valor marcado com R$ vence número solto (ex.: "99")', () => {
  const r = parse('99 corrida R$ 18,40');
  assert.equal(r.entry.amount, 18.4);
  assert.equal(r.entry.description, '99 corrida');
});

test('número da data não vira valor', () => {
  const r = parse('mercado 15/10 120');
  assert.equal(r.entry.amount, 120);
  assert.equal(r.entry.date, '2026-10-15');
});

test('limpa verbos e preposições do começo', () => {
  assert.equal(parse('gastei 30 no mercado hoje').entry.description, 'Mercado');
  assert.equal(parse('paguei 55,90 de netflix').entry.description, 'Netflix');
});

test('receita: salário cai na categoria Salário', () => {
  const r = parse('recebi salário 3000 dia 5');
  assert.equal(r.entry.description, 'Salário');
  assert.equal(r.entry.categoryId, 'c-sal');
  assert.equal(r.entry.amount, 3000);
});

test('categoria desconhecida volta vazia (usuário escolhe)', () => {
  assert.equal(parse('presente maria 80').entry.categoryId, '');
});

test('erros: vazio, sem valor, sem descrição, valor zero', () => {
  assert.equal(parse('   ').reason, 'empty');
  assert.equal(parse('uber ontem').reason, 'amount');
  assert.equal(parse('25,90 ontem').reason, 'description');
  assert.equal(parse('uber 0').reason, 'amount');
});
