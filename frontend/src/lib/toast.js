// Mini "central de avisos": qualquer tela chama showToast(...)
// e o componente Toaster, montado uma vez no app, desenha o aviso.
const listeners = new Set();
let nextId = 1;

export function showToast(message, type = 'error') {
  const toast = { id: nextId++, message, type };
  listeners.forEach((listener) => listener(toast));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Transforma o erro do axios em uma frase que a pessoa entende
export function getErrorMessage(error, fallback = 'Algo deu errado. Tente novamente.') {
  if (!error.response) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  return error.response.data?.error || fallback;
}
