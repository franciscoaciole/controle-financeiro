// Mini "central de avisos": qualquer tela chama showToast(...)
// e o componente Toaster, montado uma vez no app, desenha o aviso.
const listeners = new Set();
let nextId = 1;

function emit(event) {
  listeners.forEach((listener) => listener(event));
}

// options.action: { label, onClick } mostra um botão no aviso (ex.: "Desfazer")
// options.duration: tempo na tela, em ms. Devolve o id do aviso.
export function showToast(message, type = 'error', options = {}) {
  const toast = {
    id: nextId++,
    message,
    type,
    action: options.action || null,
    duration: options.duration ?? 4500,
  };
  emit({ kind: 'show', toast });
  return toast.id;
}

export function dismissToast(id) {
  emit({ kind: 'dismiss', id });
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
