// Monta "AAAA-MM-DD" a partir de um Date, usando o relógio local (não UTC)
export function toISODate(d) {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Data de hoje pelo relógio local, no formato AAAA-MM-DD
export function todayLocal() {
  return toISODate(new Date());
}

// "2026-10-25" -> "25/10/2026" (sem passar por Date, para não sofrer com fuso)
export function formatISODate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
