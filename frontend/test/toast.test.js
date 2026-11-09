import { test } from 'node:test';
import assert from 'node:assert/strict';
import { showToast, dismissToast, subscribe } from '../src/lib/toast.js';

test('aviso com ação "Desfazer" e duração própria, e fechamento pelo id', () => {
  const events = [];
  const unsubscribe = subscribe((e) => events.push(e));

  const id = showToast('Transação excluída.', 'success', {
    duration: 5000,
    action: { label: 'Desfazer', onClick: () => {} },
  });
  dismissToast(id);
  unsubscribe();

  assert.equal(events[0].kind, 'show');
  assert.equal(events[0].toast.action.label, 'Desfazer');
  assert.equal(events[0].toast.duration, 5000);
  assert.deepEqual(events[1], { kind: 'dismiss', id });
});

test('aviso simples continua com 4,5 s e sem ação', () => {
  let shown;
  const unsubscribe = subscribe((e) => (shown = e.toast));
  showToast('Erro qualquer.');
  unsubscribe();
  assert.equal(shown.duration, 4500);
  assert.equal(shown.action, null);
});
