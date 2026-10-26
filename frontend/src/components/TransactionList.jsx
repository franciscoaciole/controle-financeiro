import { Pencil, Trash2 } from 'lucide-react';
import { CategoryIcon } from '../lib/categoryIcons';
import { formatCurrency, formatShortDate } from '../lib/format';

function Amount({ transaction, className = '' }) {
  const isIncome = transaction.category.type === 'INCOME';
  return (
    <span
      className={`num font-semibold whitespace-nowrap ${
        isIncome ? 'text-pos' : 'text-text'
      } ${className}`}
    >
      {isIncome ? '+' : '-'}
      {formatCurrency(transaction.amount)}
    </span>
  );
}

function IconBox({ name }) {
  return (
    <div className="w-9 h-9 md:w-8 md:h-8 rounded-[10px] bg-panel-strong border border-panel-border flex items-center justify-center flex-shrink-0">
      <CategoryIcon name={name} size={14} className="text-[#D9D8D3]" />
    </div>
  );
}

function Actions({ transaction, onEdit, onDelete }) {
  return (
    <div className="flex items-center">
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          aria-label="Editar transação"
          className="p-2.5 text-muted hover:text-text transition"
        >
          <Pencil size={17} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(transaction.id)}
          aria-label="Excluir transação"
          className="p-2.5 text-muted hover:text-neg transition"
        >
          <Trash2 size={17} />
        </button>
      )}
    </div>
  );
}

function TransactionList({ transactions, onEdit, onDelete }) {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <>
      {/* Celular: lista de cartões */}
      <ul className="md:hidden">
        {transactions.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 py-3 border-t border-panel-border first:border-t-0"
          >
            <IconBox name={t.category.name} />

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate">{t.description}</p>
              <p className="text-[11px] text-muted mt-0.5 truncate">
                {t.category.name} · {formatShortDate(t.date)}
              </p>
            </div>

            <div className="flex flex-col items-end">
              <Amount transaction={t} className="text-[13px]" />
              {hasActions && (
                <Actions transaction={t} onEdit={onEdit} onDelete={onDelete} />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Telas maiores: tabela */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] text-muted uppercase tracking-wide">
              <th className="font-medium pb-3">Transação</th>
              <th className="font-medium pb-3">Categoria</th>
              <th className="font-medium pb-3">Data</th>
              <th className="font-medium pb-3 text-right">Valor</th>
              {hasActions && <th className="pb-3" />}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-panel-border group">
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <IconBox name={t.category.name} />
                    <span className="text-[12.5px] font-medium">{t.description}</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="text-[10.5px] text-muted bg-panel-strong border border-panel-border px-2 py-1 rounded-full">
                    {t.category.name}
                  </span>
                </td>
                <td className="py-3 text-[11.5px] text-muted whitespace-nowrap">
                  {formatShortDate(t.date)}
                </td>
                <td className="py-3 text-right">
                  <Amount transaction={t} className="text-[12.5px]" />
                </td>
                {hasActions && (
                  <td className="py-3">
                    <div className="flex justify-end">
                      <Actions transaction={t} onEdit={onEdit} onDelete={onDelete} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default TransactionList;
