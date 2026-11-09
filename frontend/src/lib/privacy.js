// Modo "esconder valores", como nos apps de banco.
// A escolha fica no navegador e vira um atributo no <html>:
// o CSS borra tudo que tem a classe "money" enquanto ele estiver ligado.
const STORAGE_KEY = 'finan:hideValues';
const listeners = new Set();

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let hidden = typeof window !== 'undefined' ? readStored() : false;

function apply() {
  if (typeof document === 'undefined') return;
  if (hidden) document.documentElement.dataset.hideValues = 'on';
  else delete document.documentElement.dataset.hideValues;
}

// Aplica já na carga do módulo, antes da primeira pintura: sem "piscar" os valores
apply();

export function isHidden() {
  return hidden;
}

export function setHidden(value) {
  hidden = Boolean(value);
  try {
    localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
  } catch {
    // navegador sem armazenamento: vale só para esta sessão
  }
  apply();
  listeners.forEach((listener) => listener());
}

export function toggleHidden() {
  setHidden(!hidden);
}

// Formato pedido pelo useSyncExternalStore
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
