import api from './api';

// month no formato "AAAA-MM"
export async function getMonthInsight(month) {
  const response = await api.post('/insights/month', { month });
  return response.data;
}
