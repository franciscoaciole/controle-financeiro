const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// 6287.65 -> "R$ 6.287,65"
export function formatCurrency(value) {
  return currency.format(Number(value) || 0);
}

// As datas são gravadas como dia de calendário (em UTC).
// Mostrar em UTC evita que "11 de out." vire "10 de out." no fuso do Brasil.
export function formatShortDate(value) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
}
