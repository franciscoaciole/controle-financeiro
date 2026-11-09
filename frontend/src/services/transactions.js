import api from './api';

export async function getSummary() {
  const response = await api.get('/transactions/summary');
  return response.data;
}

export async function getTransactions() {
  const response = await api.get('/transactions');
  return response.data;
}

export async function createTransaction(data) {
  const response = await api.post('/transactions', data);
  return response.data;
}

export async function updateTransaction(id, data) {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data;
}

export async function deleteTransaction(id) {
  await api.delete(`/transactions/${id}`);
}

// Usada quando a aba está fechando ou recarregando: com keepalive, o navegador
// termina de enviar a requisição mesmo depois que a página some.
export function deleteTransactionOnUnload(id) {
  let token = null;
  try {
    token = localStorage.getItem('token');
  } catch {
    // sem armazenamento não há sessão para usar
  }
  if (!token) return;
  fetch(`${import.meta.env.VITE_API_URL}/transactions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => {});
}

export async function importTransactions(transactions) {
  const response = await api.post('/transactions/import', { transactions });
  return response.data;
}
