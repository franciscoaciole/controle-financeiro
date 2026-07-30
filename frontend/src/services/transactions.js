import api from './api';

export async function getSummary() {
  const response = await api.get('/transactions/summary');
  return response.data;
}

export async function getTransactions() {
  const response = await api.get('/transactions');
  return response.data;
}