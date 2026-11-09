import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  scheduleDelete,
  cancelDelete,
  isDeletePending,
  flushDeletes,
  sendDeletesOnUnload,
} from '../src/lib/pendingDeletes.js';

mock.timers.enable({ apis: ['setTimeout'] });

function spy(result) {
  const calls = [];
  const fn = (...args) => {
    calls.push(args);
    return result;
  };
  fn.calls = calls;
  return fn;
}

test('envia a exclusão só depois do prazo', async () => {
  const remove = spy(Promise.resolve());
  scheduleDelete('a', { delay: 5000, remove });
  assert.equal(isDeletePending('a'), true);

  mock.timers.tick(4999);
  assert.equal(remove.calls.length, 0);
  mock.timers.tick(1);
  await Promise.resolve();
  assert.deepEqual(remove.calls, [['a']]);
  await flushDeletes();
  assert.equal(isDeletePending('a'), false);
});

test('desfazer dentro do prazo cancela e nada é enviado', () => {
  const remove = spy(Promise.resolve());
  scheduleDelete('b', { delay: 5000, remove });
  assert.equal(cancelDelete('b'), true);
  mock.timers.tick(10000);
  assert.equal(remove.calls.length, 0);
  assert.equal(isDeletePending('b'), false);
});

test('desfazer não vale depois que o envio começou', async () => {
  let finish;
  const remove = spy(new Promise((r) => (finish = r)));
  scheduleDelete('c', { delay: 5000, remove });
  mock.timers.tick(5000);
  assert.equal(cancelDelete('c'), false); // já está sendo enviado
  assert.equal(isDeletePending('c'), true); // continua escondido até terminar
  finish();
  await flushDeletes();
  await Promise.resolve();
  assert.equal(isDeletePending('c'), false);
  assert.equal(remove.calls.length, 1);
});

test('flush (ex.: sair da conta) envia tudo na hora, uma vez só', async () => {
  const remove = spy(Promise.resolve());
  scheduleDelete('d', { delay: 5000, remove });
  scheduleDelete('e', { delay: 5000, remove });
  await flushDeletes();
  assert.deepEqual(remove.calls.map(([id]) => id).sort(), ['d', 'e']);
  mock.timers.tick(10000);
  assert.equal(remove.calls.length, 2); // o prazo vencendo não reenvia
});

test('falha no envio chama onFail', async () => {
  const error = new Error('servidor fora');
  const onFail = spy();
  scheduleDelete('f', { delay: 5000, remove: () => Promise.reject(error), onFail });
  await flushDeletes();
  assert.deepEqual(onFail.calls, [[error]]);
  assert.equal(isDeletePending('f'), false);
});

test('aba fechando: usa o envio que sobrevive à página e não reenvia depois', () => {
  const remove = spy(Promise.resolve());
  const removeOnUnload = spy();
  scheduleDelete('g', { delay: 5000, remove, removeOnUnload });
  sendDeletesOnUnload();
  assert.deepEqual(removeOnUnload.calls, [['g']]);
  mock.timers.tick(10000);
  assert.equal(remove.calls.length, 0);
  assert.equal(isDeletePending('g'), false);
});
