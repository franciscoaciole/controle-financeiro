import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plural } from '../src/lib/plural.js';

test('plural usa o singular só para 1 (BUG-07)', () => {
  assert.equal(plural(1, 'lançamento lido', 'lançamentos lidos'), '1 lançamento lido');
  assert.equal(plural(0, 'lançamento lido', 'lançamentos lidos'), '0 lançamentos lidos');
  assert.equal(plural(4, 'marcado', 'marcados'), '4 marcados');
});
