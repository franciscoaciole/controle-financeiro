import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shortcutFor, isTypingTarget } from '../src/lib/shortcuts.js';

const key = (k, extra = {}) => ({ key: k, target: { tagName: 'BODY' }, ...extra });

test('reconhece os atalhos, com ou sem maiúscula', () => {
  assert.equal(shortcutFor(key('n')), 'new-transaction');
  assert.equal(shortcutFor(key('N')), 'new-transaction');
  assert.equal(shortcutFor(key('/')), 'quick-entry');
  assert.equal(shortcutFor(key('b')), 'search');
  assert.equal(shortcutFor(key('h')), 'toggle-values');
  assert.equal(shortcutFor(key('?')), 'help');
  assert.equal(shortcutFor(key('x')), null);
});

test('não dispara enquanto a pessoa digita', () => {
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
    assert.equal(shortcutFor(key('n', { target: { tagName } })), null);
  }
  assert.equal(isTypingTarget({ tagName: 'DIV', isContentEditable: true }), true);
});

test('não dispara com Ctrl/Cmd/Alt, tecla repetida ou janela aberta', () => {
  assert.equal(shortcutFor(key('n', { ctrlKey: true })), null); // Ctrl+N é do navegador
  assert.equal(shortcutFor(key('n', { metaKey: true })), null);
  assert.equal(shortcutFor(key('b', { altKey: true })), null);
  assert.equal(shortcutFor(key('n', { repeat: true })), null);
  assert.equal(shortcutFor(key('n'), { modalOpen: true }), null);
});
