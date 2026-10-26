import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseStatement,
  parseSignedAmount,
  parseStatementDate,
  decodeStatementBytes,
  deriveRows,
  propagateCategory,
  rowsToPayload,
  MAX_ROWS,
} from '../src/lib/statementParser.js';

const categories = [
  { id: 'c-sal', name: 'Salário', type: 'INCOME' },
  { id: 'c-ali', name: 'Alimentação', type: 'EXPENSE' },
  { id: 'c-tra', name: 'Transporte', type: 'EXPENSE' },
  { id: 'c-ent', name: 'Entretenimento', type: 'EXPENSE' },
];

test('valores: formatos brasileiros e sinais', () => {
  assert.equal(parseSignedAmount('-1.234,56'), -1234.56);
  assert.equal(parseSignedAmount('R$ 25,90'), 25.9);
  assert.equal(parseSignedAmount('(25,90)'), -25.9);
  assert.equal(parseSignedAmount('25,90 D'), -25.9);
  assert.equal(parseSignedAmount('25,90 C'), 25.9);
  assert.equal(parseSignedAmount('25,90-'), -25.9);
  assert.equal(parseSignedAmount('-25.90'), -25.9);
  assert.equal(parseSignedAmount('1.250'), 1250);
  assert.equal(parseSignedAmount('1,234.56'), 1234.56);
  assert.ok(Number.isNaN(parseSignedAmount('')));
  assert.ok(Number.isNaN(parseSignedAmount('abc')));
});

test('datas: vários formatos e datas inexistentes', () => {
  assert.equal(parseStatementDate('2026-10-25'), '2026-10-25');
  assert.equal(parseStatementDate('25/10/2026'), '2026-10-25');
  assert.equal(parseStatementDate('25-10-26'), '2026-10-25');
  assert.equal(parseStatementDate('25.10.2026'), '2026-10-25');
  assert.equal(parseStatementDate('20261025120000[-3:BRT]'), '2026-10-25');
  assert.equal(parseStatementDate('31/02/2026'), null);
  assert.equal(parseStatementDate('Total'), null);
});

test('OFX no estilo SGML (sem tags de fechamento)', () => {
  const ofx = `OFXHEADER:100
DATA:OFXSGML
CHARSET:1252

<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261020120000[-3:BRT]
<TRNAMT>-25.90
<FITID>abc1
<MEMO>Uber *Trip
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20261005
<TRNAMT>3000.00
<FITID>abc2
<NAME>Salário Empresa &amp; Cia
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261021
<TRNAMT>0.00
<MEMO>Tarifa zerada
</STMTTRN>
</BANKTRANLIST><LEDGERBAL><BALAMT>100.00</LEDGERBAL></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
  const r = parseStatement(ofx);
  assert.equal(r.ok, true);
  assert.equal(r.format, 'ofx');
  assert.equal(r.skipped, 1);
  assert.deepEqual(r.rows, [
    { id: 0, date: '2026-10-20', description: 'Uber *Trip', amount: 25.9, kind: 'EXPENSE' },
    { id: 1, date: '2026-10-05', description: 'Salário Empresa & Cia', amount: 3000, kind: 'INCOME' },
  ]);
});

test('OFX no estilo XML (com tags de fechamento)', () => {
  const ofx = `<OFX><STMTTRN><DTPOSTED>20261020</DTPOSTED><TRNAMT>-10.50</TRNAMT><MEMO>Padaria</MEMO></STMTTRN></OFX>`;
  const r = parseStatement(ofx);
  assert.equal(r.rows[0].description, 'Padaria');
  assert.equal(r.rows[0].amount, 10.5);
});

test('CSV de conta (Data,Valor,Identificador,Descrição): negativo é gasto', () => {
  const csv = `Data,Valor,Identificador,Descrição
20/10/2026,-25.90,id1,Uber *Trip
05/10/2026,3000.00,id2,Salário Empresa`;
  const r = parseStatement(csv);
  assert.equal(r.ok, true);
  assert.equal(r.format, 'csv');
  assert.deepEqual(
    r.rows.map((x) => [x.date, x.description, x.amount, x.kind]),
    [
      ['2026-10-20', 'Uber *Trip', 25.9, 'EXPENSE'],
      ['2026-10-05', 'Salário Empresa', 3000, 'INCOME'],
    ]
  );
});

test('CSV de fatura de cartão (date,category,title,amount): positivo é gasto', () => {
  const csv = `date,category,title,amount
2026-10-20,restaurante,Ifood *Pedido,42.30
2026-10-12,pagamento,Pagamento recebido,-500.00`;
  const r = parseStatement(csv);
  assert.equal(r.rows[0].kind, 'EXPENSE');
  assert.equal(r.rows[0].amount, 42.3);
  assert.equal(r.rows[0].description, 'Ifood *Pedido');
  assert.equal(r.rows[1].kind, 'INCOME');
});

test('CSV com ponto e vírgula, colunas de débito/crédito, linhas de saldo e texto antes do cabeçalho', () => {
  const csv = `Extrato de conta corrente;;;;
Agência: 1234;;;;
;;;;
Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)
01/10/2026;SALDO ANTERIOR;;;;1.000,00
02/10/2026;Supermercado Bom Preço;123;;150,75;849,25
05/10/2026;Salário;456;3.000,00;;3.849,25
Total;;;3.000,00;150,75;`;
  const r = parseStatement(csv);
  assert.equal(r.ok, true);
  assert.deepEqual(
    r.rows.map((x) => [x.date, x.description, x.amount, x.kind]),
    [
      ['2026-10-02', 'Supermercado Bom Preço', 150.75, 'EXPENSE'],
      ['2026-10-05', 'Salário', 3000, 'INCOME'],
    ]
  );
  assert.equal(r.skipped, 2); // saldo anterior + linha "Total"
});

test('CSV com campos entre aspas contendo o separador', () => {
  const csv = `Data;Descrição;Valor
20/10/2026;"Restaurante; Centro";-80,00`;
  const r = parseStatement(csv);
  assert.equal(r.rows[0].description, 'Restaurante; Centro');
});

test('descrições longas são cortadas em 100 caracteres', () => {
  const csv = `Data;Descrição;Valor\n20/10/2026;${'A'.repeat(150)};-10,00`;
  assert.equal(parseStatement(csv).rows[0].description.length, 100);
});

test('erros: vazio, colunas desconhecidas, sem lançamentos e arquivo grande demais', () => {
  assert.equal(parseStatement('  ').ok, false);
  assert.equal(parseStatement('foo;bar\n1;2').ok, false);
  assert.match(parseStatement('Data;Descrição;Valor\nTotal;x;y').message, /Nenhum lançamento/);

  const big = ['Data;Descrição;Valor']
    .concat(Array.from({ length: MAX_ROWS + 1 }, (_, i) => `01/10/2026;Item ${i};-1,00`))
    .join('\n');
  const r = parseStatement(big);
  assert.equal(r.ok, false);
  assert.match(r.message, /limite/);
});

test('decodifica UTF-8 e Windows-1252', () => {
  const utf8 = new TextEncoder().encode('Salário');
  assert.equal(decodeStatementBytes(utf8.buffer), 'Salário');
  // "Salário" em Windows-1252: o "á" é o byte 0xE1 (inválido como UTF-8)
  const latin = Uint8Array.from([0x53, 0x61, 0x6c, 0xe1, 0x72, 0x69, 0x6f]);
  assert.equal(decodeStatementBytes(latin.buffer), 'Salário');
});

const base = [
  { id: 0, date: '2026-10-20', description: 'Uber *Trip', amount: 25.9, kind: 'EXPENSE' },
  { id: 1, date: '2026-10-05', description: 'Salário Empresa', amount: 3000, kind: 'INCOME' },
  { id: 2, date: '2026-10-21', description: 'Pix Maria', amount: 80, kind: 'EXPENSE' },
  { id: 3, date: '2026-10-22', description: 'Pix Maria', amount: 80, kind: 'EXPENSE' },
];

test('prévia: sugere categoria respeitando o tipo e deixa as desconhecidas vazias', () => {
  const rows = deriveRows({ baseRows: base, categories });
  assert.equal(rows[0].categoryId, 'c-tra');
  assert.equal(rows[1].categoryId, 'c-sal');
  assert.equal(rows[2].categoryId, '');
});

test('prévia: marca duplicadas consumindo uma existente por vez', () => {
  const existing = [{ date: '2026-10-20T00:00:00.000Z', amount: '25.90', description: 'uber *trip' }];
  const rows = deriveRows({ baseRows: base, categories, existing });
  assert.equal(rows[0].duplicate, true);
  assert.equal(rows[0].selected, false);
  assert.equal(rows[1].duplicate, false);
  assert.equal(rows[1].selected, true);

  // duas linhas iguais no arquivo, só uma já existente: só a primeira é duplicada
  const twin = [
    { id: 0, date: '2026-10-20', description: 'Café', amount: 5, kind: 'EXPENSE' },
    { id: 1, date: '2026-10-20', description: 'Café', amount: 5, kind: 'EXPENSE' },
  ];
  const ex = [{ date: '2026-10-20T00:00:00.000Z', amount: '5.00', description: 'Café' }];
  const r2 = deriveRows({ baseRows: twin, categories, existing: ex });
  assert.deepEqual(r2.map((r) => r.duplicate), [true, false]);
});

test('prévia: escolha manual vale, seleção manual vale e inverter troca o tipo', () => {
  let rows = deriveRows({ baseRows: base, categories });
  const overrides = propagateCategory(rows, 2, 'c-ali', {});
  assert.equal(overrides[3], 'c-ali'); // mesma descrição sem categoria herda a escolha

  rows = deriveRows({ baseRows: base, categories, overrides, selection: { 0: false } });
  assert.equal(rows[2].categoryId, 'c-ali');
  assert.equal(rows[0].selected, false);

  const inverted = deriveRows({ baseRows: base, categories, inverted: true, overrides });
  assert.equal(inverted[1].kind, 'EXPENSE');
  assert.equal(inverted[1].categoryId, ''); // Salário (receita) não serve mais
  assert.equal(inverted[2].kind, 'INCOME');
  assert.equal(inverted[2].categoryId, ''); // Alimentação (despesa) não serve mais
});

test('payload: só linhas marcadas e com categoria', () => {
  const rows = deriveRows({ baseRows: base, categories, selection: { 1: false } });
  assert.deepEqual(rowsToPayload(rows), [
    { description: 'Uber *Trip', amount: 25.9, date: '2026-10-20', categoryId: 'c-tra' },
  ]);
});
