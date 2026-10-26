import { useMemo, useState } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';
import {
  parseStatement,
  decodeStatementBytes,
  deriveRows,
  propagateCategory,
  rowsToPayload,
} from '../lib/statementParser';
import { formatCurrency } from '../lib/format';
import { formatISODate } from '../lib/dates';

const MAX_FILE_BYTES = 1024 * 1024; // 1 MB

// Formulário remontado a cada abertura (key): estado limpo sem useEffect.
function ImportStatement({ isOpen, ...props }) {
  if (!isOpen) return null;
  return <ImportForm {...props} />;
}

function ImportForm({ onClose, onImport, categories, existing }) {
  const [parsed, setParsed] = useState(null); // { fileName, rows, skipped }
  const [error, setError] = useState('');
  const [inverted, setInverted] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [selection, setSelection] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rows = useMemo(
    () =>
      parsed
        ? deriveRows({
            baseRows: parsed.rows,
            inverted,
            categories,
            existing,
            overrides,
            selection,
          })
        : [],
    [parsed, inverted, categories, existing, overrides, selection]
  );

  const payload = useMemo(() => rowsToPayload(rows), [rows]);
  const duplicates = rows.filter((r) => r.duplicate).length;
  const missingCategory = rows.filter((r) => r.selected && !r.categoryId).length;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!file) return;

    setError('');
    if (file.size > MAX_FILE_BYTES) {
      setError('Arquivo grande demais (máximo de 1 MB).');
      return;
    }

    try {
      const result = parseStatement(decodeStatementBytes(await file.arrayBuffer()));
      if (!result.ok) {
        setParsed(null);
        setError(result.message);
        return;
      }
      setParsed({ fileName: file.name, rows: result.rows, skipped: result.skipped });
      setInverted(false);
      setOverrides({});
      setSelection({});
    } catch (err) {
      console.error('Erro ao ler extrato:', err);
      setParsed(null);
      setError('Não foi possível ler o arquivo.');
    }
  }

  function handleCategoryChange(rowId, categoryId) {
    setOverrides((current) => propagateCategory(rows, rowId, categoryId, current));
  }

  async function handleSubmit() {
    if (isSubmitting || payload.length === 0) return;
    setIsSubmitting(true);
    try {
      const imported = await onImport(payload);
      if (imported) onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-panel backdrop-blur-xl border border-panel-border rounded-[18px] p-5 md:p-6">
        <div className="flex justify-between items-center gap-2 mb-4">
          <h2 className="font-display text-[17px] font-semibold tracking-tight">
            Importar extrato
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted hover:text-text transition"
          >
            <X size={18} />
          </button>
        </div>

        <label className="flex items-center justify-center gap-2 cursor-pointer bg-panel-strong border border-dashed border-panel-border hover:border-accent/60 rounded-[10px] px-4 py-4 text-[12.5px] text-text transition">
          <Upload size={15} />
          {parsed ? `Trocar arquivo (${parsed.fileName})` : 'Escolher arquivo .csv ou .ofx'}
          <input
            type="file"
            accept=".csv,.ofx,.txt,text/csv"
            onChange={handleFile}
            className="sr-only"
          />
        </label>

        {!parsed && !error && (
          <p className="text-[11.5px] text-muted mt-3 px-1">
            Baixe o extrato no app ou site do seu banco (formato OFX ou CSV). O arquivo é
            lido no seu navegador e nada é gravado antes de você confirmar.
          </p>
        )}

        {error && (
          <p className="flex items-start gap-2 text-[12px] text-neg mt-3 px-1">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </p>
        )}

        {parsed && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-4 px-1">
              <p className="text-[11.5px] text-muted">
                {parsed.rows.length} lançamentos lidos
                {parsed.skipped > 0 && ` · ${parsed.skipped} linhas ignoradas`}
                {duplicates > 0 && ` · ${duplicates} possíveis duplicados`}
              </p>
              <label className="flex items-center gap-2 text-[11.5px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={inverted}
                  onChange={(e) => setInverted(e.target.checked)}
                />
                Inverter entradas e saídas
              </label>
            </div>

            <ul className="flex-1 min-h-0 overflow-y-auto mt-3 divide-y divide-panel-border border-y border-panel-border">
              {rows.map((row) => (
                <li key={row.id} className="py-3 px-1 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(e) =>
                        setSelection((s) => ({ ...s, [row.id]: e.target.checked }))
                      }
                      aria-label={`Importar ${row.description}`}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] text-text truncate">{row.description}</p>
                      <p className="text-[11px] text-muted">
                        {formatISODate(row.date)}
                        {row.duplicate && (
                          <span className="text-neg"> · possível duplicado</span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`num text-[12.5px] font-semibold whitespace-nowrap ${
                        row.kind === 'INCOME' ? 'text-pos' : 'text-text'
                      }`}
                    >
                      {row.kind === 'INCOME' ? '+' : '-'}
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                  <select
                    value={row.categoryId}
                    onChange={(e) => handleCategoryChange(row.id, e.target.value)}
                    aria-label={`Categoria de ${row.description}`}
                    className={`ml-7 bg-panel-strong border rounded-[8px] px-2.5 py-1.5 text-[12px] text-text outline-none [color-scheme:dark] focus:border-accent/60 ${
                      row.selected && !row.categoryId
                        ? 'border-neg/60'
                        : 'border-panel-border'
                    }`}
                  >
                    {!row.categoryId && <option value="">Escolha a categoria</option>}
                    {categories
                      .filter((c) => c.type === row.kind)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 mt-4">
              {missingCategory > 0 && (
                <p className="text-[11.5px] text-muted px-1">
                  {missingCategory} marcados sem categoria: escolha uma ou desmarque
                  para não importar.
                </p>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || payload.length === 0}
                className="bg-accent text-bg rounded-[10px] py-3 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Importando...'
                  : `Importar ${payload.length} ${payload.length === 1 ? 'transação' : 'transações'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ImportStatement;
