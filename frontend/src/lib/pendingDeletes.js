// Exclusões aguardando o prazo do "Desfazer".
// Ficam fora da tela de Transações para que outras partes do app consigam
// enviá-las na hora: ao sair da conta (antes de o token ser apagado) e ao
// fechar ou recarregar a aba (sem isso, a exclusão se perdia em silêncio).
const pending = new Map(); // id -> { timer, remove, removeOnUnload, onFail, committing }

async function commit(id) {
  const entry = pending.get(id);
  if (!entry || entry.committing) return;
  entry.committing = true; // a partir daqui o "Desfazer" não vale mais
  clearTimeout(entry.timer);
  try {
    await entry.remove(id);
  } catch (error) {
    entry.onFail?.(error);
  } finally {
    pending.delete(id);
  }
}

// remove: envia a exclusão (Promise). removeOnUnload: versão que sobrevive ao
// fechamento da aba (fetch com keepalive). onFail: chamado se o envio falhar.
export function scheduleDelete(id, { delay, remove, removeOnUnload, onFail }) {
  if (pending.has(id)) return;
  const timer = setTimeout(() => commit(id), delay);
  pending.set(id, { timer, remove, removeOnUnload, onFail, committing: false });
}

// "Desfazer": só funciona enquanto o envio não começou
export function cancelDelete(id) {
  const entry = pending.get(id);
  if (!entry || entry.committing) return false;
  clearTimeout(entry.timer);
  pending.delete(id);
  return true;
}

export function isDeletePending(id) {
  return pending.has(id);
}

// Envia na hora tudo o que está esperando (ex.: antes de sair da conta)
export function flushDeletes() {
  return Promise.all([...pending.keys()].map(commit));
}

// Aba fechando ou recarregando: não dá para esperar resposta, então cada
// exclusão vai por removeOnUnload, que o navegador termina de enviar sozinho.
export function sendDeletesOnUnload() {
  for (const [id, entry] of pending) {
    if (entry.committing) continue;
    clearTimeout(entry.timer);
    entry.removeOnUnload?.(id);
    pending.delete(id);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', sendDeletesOnUnload);
}
