// Atalhos de teclado do app. Ficam desligados enquanto a pessoa digita
// ou quando há uma janela (modal) aberta.
export const SHORTCUTS = [
  { key: 'n', action: 'new-transaction', label: 'Nova transação' },
  { key: '/', action: 'quick-entry', label: 'Lançamento rápido' },
  { key: 'b', action: 'search', label: 'Buscar transações' },
  { key: 'h', action: 'toggle-values', label: 'Esconder ou mostrar valores' },
  { key: '?', action: 'help', label: 'Ver os atalhos' },
];

export function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
}

// Recebe o evento de teclado e devolve a ação (ou null)
export function shortcutFor(event, { modalOpen = false } = {}) {
  if (event.defaultPrevented || event.repeat) return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (modalOpen || isTypingTarget(event.target)) return null;

  const key = event.key?.length === 1 ? event.key.toLowerCase() : event.key;
  return SHORTCUTS.find((s) => s.key === key)?.action ?? null;
}
