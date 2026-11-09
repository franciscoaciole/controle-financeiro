import { useState } from 'react';
import { FileText } from 'lucide-react';
import { getMonthInsight } from '../services/insights';
import { monthsWithTransactions, formatMonthKey } from '../lib/months';
import { getErrorMessage } from '../lib/toast';

// "outubro de 2026" -> "Outubro de 2026" (o CSS capitalize deixaria "De" maiúsculo)
const capitalizeFirst = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function MonthInsight({ transactions }) {
  const months = monthsWithTransactions(transactions);
  const [month, setMonth] = useState(months[0] || '');
  // Resumos já gerados ficam guardados por mês: trocar e voltar não refaz o pedido
  const [results, setResults] = useState({});
  const [loadingMonth, setLoadingMonth] = useState('');
  const [error, setError] = useState('');

  if (months.length === 0) return null;

  const selected = months.includes(month) ? month : months[0];
  const summary = results[selected];
  const isLoading = loadingMonth === selected;

  async function handleGenerate() {
    setError('');
    setLoadingMonth(selected);
    try {
      const data = await getMonthInsight(selected);
      setResults((prev) => ({ ...prev, [selected]: data.summary }));
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível gerar o resumo.'));
    } finally {
      setLoadingMonth('');
    }
  }

  const paragraphs = summary
    ? summary.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <section
      aria-labelledby="month-insight-title"
      className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-5 md:p-[22px_24px] mt-4 md:mt-[18px]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <FileText size={16} className="text-accent shrink-0" aria-hidden="true" />
          <div>
            <h2 id="month-insight-title" className="text-[13px] font-semibold">
              Resumo do mês
            </h2>
            <p className="text-[11px] text-muted">Um panorama escrito a partir dos seus totais</p>
          </div>
        </div>

        <div className="flex gap-2">
          <label htmlFor="insight-month" className="sr-only">Mês do resumo</label>
          <select
            id="insight-month"
            value={selected}
            onChange={(e) => {
              setMonth(e.target.value);
              setError('');
            }}
            disabled={isLoading}
            className="bg-panel-strong border border-panel-border rounded-[10px] px-3 py-2 text-[12.5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-60"
          >
            {months.map((key) => (
              <option key={key} value={key}>
                {capitalizeFirst(formatMonthKey(key))}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-accent text-bg px-4 py-2 rounded-[10px] text-[12.5px] font-semibold whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
          >
            {isLoading ? 'Gerando resumo…' : summary ? 'Atualizar' : 'Gerar resumo'}
          </button>
        </div>
      </div>

      <div aria-live="polite" aria-busy={isLoading}>
        {error && <p className="text-neg text-[12.5px]">{error}</p>}

        {!error && isLoading && (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-3 rounded bg-panel-strong animate-pulse motion-reduce:animate-none w-11/12" />
            <div className="h-3 rounded bg-panel-strong animate-pulse motion-reduce:animate-none w-4/5" />
            <div className="h-3 rounded bg-panel-strong animate-pulse motion-reduce:animate-none w-2/3" />
          </div>
        )}

        {!error && !isLoading && paragraphs.length > 0 && (
          <div className="space-y-3 max-w-[68ch]">
            {paragraphs.map((p, i) => (
              <p key={i} className="money text-[13.5px] leading-relaxed text-text/90">
                {p}
              </p>
            ))}
            <p className="text-[11px] text-muted-2 pt-1">
              Calculado a partir das transações registradas no mês.
            </p>
          </div>
        )}

        {!error && !isLoading && paragraphs.length === 0 && (
          <p className="text-muted text-[12.5px]">
            Escolha um mês e gere um resumo com receitas, gastos e uma sugestão para o próximo mês.
          </p>
        )}
      </div>
    </section>
  );
}

export default MonthInsight;
