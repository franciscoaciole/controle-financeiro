import { Pencil, Trash2 } from 'lucide-react';
import { CategoryIcon } from '../lib/categoryIcons';
import { formatCurrency } from '../lib/format';
import { groupByDay, dayLabel } from '../lib/transactionGroups';

function Amount({ transaction, className = '' }) {
  const isIncome = transaction.category.type === 'INCOME';
  return (
    <span
      className={`money num font-semibold whitespace-nowrap ${
        isIncome ? 'text-pos' : 'text-text'
      } ${className}`}
    >
      {isIncome ? '+' : '-'}
      {formatCurrency(transaction.amount)}
    </span>
  );
}

// Saldo do dia: "+R$ 120,00" em verde ou "-R$ 35,90" discreto
function DayNet({ value }) {
  if (value === 0) return null;
  return (
    <span className={`money num text-[11px] font-medium ${value > 0 ? 'text-pos' : 'text-muted'}`}>
      {value > 0 ? '+' : '-'}
      {formatCurrency(Math.abs(value))}
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
          aria-label={`Editar ${transaction.description}`}
          className="p-2.5 text-muted hover:text-text transition"
        >
          <Pencil size={17} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(transaction.id)}
          aria-label={`Excluir ${transaction.description}`}
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
  const groups = groupByDay(transactions);

  return (
    <>
      {/* Celular: cartões agrupados por dia */}
      <div className="md:hidden">
        {groups.map((group) => (
          <section key={group.key} aria-label={dayLabel(group.key)}>
            <div className="flex items-center justify-between pt-4 pb-1.5 first:pt-0">
              <h3 className="text-[11.5px] font-semibold text-muted first-letter:uppercase">
                {dayLabel(group.key)}
              </h3>
              <DayNet value={group.net} />
            </div>
            <ul>
              {group.items.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 py-3 border-t border-panel-border"
                >
                  <IconBox name={t.category.name} />

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{t.description}</p>
                    <p className="text-[11px] text-muted mt-0.5 truncate">{t.category.name}</p>
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
          </section>
        ))}
      </div>

      {/* Telas maiores: tabela com um cabeçalho por dia */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="sr-only">
            <tr>
              <th>Transação</th>
              <th>Categoria</th>
              <th>Valor</th>
              {hasActions && <th>Ações</th>}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.key}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={2}
                  className="pt-5 pb-2 text-[11.5px] font-semibold text-muted text-left first-letter:uppercase"
                >
                  {dayLabel(group.key)}
                </th>
                <td className="pt-5 pb-2 text-right">
                  <DayNet value={group.net} />
                </td>
                {hasActions && <td />}
              </tr>
              {group.items.map((t) => (
                <tr key={t.id} className="border-t border-panel-border">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <IconBox name={t.category.name} />
                      <span className="text-[12.5px] font-medium">{t.description}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-[10.5px] text-muted bg-panel-strong border border-panel-border px-2 py-1 rounded-full whitespace-nowrap">
                      {t.category.name}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Amount transaction={t} className="text-[12.5px]" />
                  </td>
                  {hasActions && (
                    <td className="py-3 w-[96px]">
                      <div className="flex justify-end">
                        <Actions transaction={t} onEdit={onEdit} onDelete={onDelete} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}

export default TransactionList;
