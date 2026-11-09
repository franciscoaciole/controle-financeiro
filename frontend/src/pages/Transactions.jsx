import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Upload, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactions,
} from '../services/transactions';
import { getCategories } from '../services/categories';
import TransactionModal from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';
import QuickEntry from '../components/QuickEntry';
import ImportStatement from '../components/ImportStatement';
import { TransactionsSkeleton } from '../components/Skeleton';
import { showToast, dismissToast, getErrorMessage } from '../lib/toast';
import { formatCurrency } from '../lib/format';
import {
  monthKeyOf,
  currentMonthKey,
  shiftMonth,
  formatMonthKey,
  isValidMonthKey,
} from '../lib/months';
import {
  filterTransactions,
  sumTransactions,
  restoreTransaction,
} from '../lib/transactionGroups';

const UNDO_MS = 5000;

const TYPE_FILTERS = [
  { key: 'ALL', label: 'Todas' },
  { key: 'INCOME', label: 'Receitas' },
  { key: 'EXPENSE', label: 'Despesas' },
];

// Mês inicial: o da URL (vindo do Dashboard), senão o mês atual se tiver
// lançamentos, senão o mês mais recente com lançamentos.
function initialMonth(param, transactions) {
  if (param === 'all' || isValidMonthKey(param)) return param;
  const current = currentMonthKey();
  const months = transactions.map((t) => monthKeyOf(t.date)).filter(Boolean).sort();
  if (months.length === 0 || months.includes(current)) return current;
  return months[months.length - 1];
}

function Transactions() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState(null); // definido depois do carregamento

  const categoryId = searchParams.get('category') || '';
  const quickRef = useRef(null);
  const searchRef = useRef(null);

  // Exclusões aguardando o prazo do "Desfazer": id -> { timer, toastId }
  const pendingDeletes = useRef(new Map());

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [transactionsData, categoriesData] = await Promise.all([
          getTransactions(),
          getCategories(),
        ]);
        if (ignore) return;
        // Quem está no prazo do "Desfazer" continua escondido mesmo após recarregar
        const visible = transactionsData.filter((t) => !pendingDeletes.current.has(t.id));
        setTransactions(visible);
        setCategories(categoriesData);
        setMonth((m) => m ?? initialMonth(searchParams.get('month'), visible));
      } catch (error) {
        console.error('Erro ao carregar dados.');
        showToast(getErrorMessage(error, 'Não foi possível carregar as transações.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
    // searchParams só é lido na primeira carga, para definir o mês inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // Ao sair da tela, as exclusões pendentes são enviadas na hora
  useEffect(() => {
    const pending = pendingDeletes.current;
    return () => {
      pending.forEach(({ timer, toastId }, id) => {
        clearTimeout(timer);
        dismissToast(toastId); // o "Desfazer" não vale mais fora desta tela
        deleteTransaction(id).catch(() => {
          showToast('Uma exclusão não foi concluída. Confira a lista de transações.');
        });
      });
      pending.clear();
    };
  }, []);

  // Atalhos vindos do Layout (N, / e B) chegam como "state" da navegação.
  // Abrir o modal é estado: é ajustado durante a renderização, uma vez por navegação
  // (padrão do React para reagir a uma mudança, sem setState dentro de efeito).
  const shortcut = loading ? null : location.state?.action;
  const [handledKey, setHandledKey] = useState(null);
  if (shortcut && handledKey !== location.key) {
    setHandledKey(location.key);
    if (shortcut === 'new-transaction') {
      setEditingTransaction(null);
      setModalOpen(true);
    }
  }

  // Dar foco num campo é efeito colateral (mexe no DOM): fica no efeito
  useEffect(() => {
    if (!shortcut) return;
    if (shortcut === 'quick-entry') quickRef.current?.focus();
    if (shortcut === 'search') searchRef.current?.focus();
    // Limpa o state para o atalho não disparar de novo ao recarregar
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [shortcut, location.key, location.pathname, location.search, navigate]);

  function openCreateModal() {
    setEditingTransaction(null);
    setModalOpen(true);
  }

  function openEditModal(transaction) {
    setEditingTransaction(transaction);
    setModalOpen(true);
  }

  async function handleSave(data) {
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
      } else {
        await createTransaction(data);
      }
      setModalOpen(false);
      showToast(
        editingTransaction ? 'Transação atualizada.' : 'Transação criada.',
        'success'
      );
      reload();
    } catch (error) {
      console.error('Erro ao salvar transação.');
      showToast(getErrorMessage(error, 'Não foi possível salvar a transação.'));
    }
  }

  // Lançamento rápido: devolve true/false para o campo saber se pode limpar o texto
  async function handleQuickCreate(data) {
    try {
      await createTransaction(data);
      showToast('Transação criada.', 'success');
      reload();
      return true;
    } catch (error) {
      console.error('Erro ao criar transação.');
      showToast(getErrorMessage(error, 'Não foi possível salvar a transação.'));
      return false;
    }
  }

  // Importação de extrato: devolve true/false para o modal saber se pode fechar
  async function handleImport(payload) {
    try {
      const { imported } = await importTransactions(payload);
      showToast(
        `${imported} ${imported === 1 ? 'transação importada' : 'transações importadas'}.`,
        'success'
      );
      reload();
      return true;
    } catch (error) {
      console.error('Erro ao importar extrato.');
      showToast(getErrorMessage(error, 'Não foi possível importar o extrato.'));
      return false;
    }
  }

  // Exclusão com "Desfazer": some da lista na hora e só vai para o servidor
  // depois de 5 segundos. Se a pessoa desfizer, nada é enviado.
  const handleDelete = useCallback(
    (id) => {
      const transaction = transactions.find((t) => t.id === id);
      if (!transaction) return;

      setTransactions((list) => list.filter((t) => t.id !== id));

      const commit = async () => {
        pendingDeletes.current.delete(id);
        try {
          await deleteTransaction(id);
        } catch (error) {
          setTransactions((list) => restoreTransaction(list, transaction));
          showToast(getErrorMessage(error, 'Não foi possível excluir a transação.'));
        }
      };

      const timer = setTimeout(commit, UNDO_MS);

      const toastId = showToast('Transação excluída.', 'success', {
        duration: UNDO_MS,
        action: {
          label: 'Desfazer',
          onClick: () => {
            const pending = pendingDeletes.current.get(id);
            if (!pending) return;
            clearTimeout(pending.timer);
            pendingDeletes.current.delete(id);
            setTransactions((list) => restoreTransaction(list, transaction));
          },
        },
      });
      pendingDeletes.current.set(id, { timer, toastId });
    },
    [transactions]
  );

  function clearCategory() {
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    setSearchParams(next, { replace: true });
  }

  if (loading || month === null) {
    return <TransactionsSkeleton />;
  }

  const searching = query.trim().length > 0;
  const filtered = filterTransactions(transactions, {
    month,
    query,
    type: filter,
    categoryId,
  });
  const totals = sumTransactions(filtered);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Limites da navegação: do mês mais antigo com lançamento até o mês atual
  const monthKeys = transactions.map((t) => monthKeyOf(t.date)).filter(Boolean).sort();
  const minMonth = monthKeys[0] || currentMonthKey();
  const latest = monthKeys[monthKeys.length - 1];
  const maxMonth = latest && latest > currentMonthKey() ? latest : currentMonthKey();
  const canPrev = month !== 'all' && month > minMonth;
  const canNext = month !== 'all' && month < maxMonth;

  const periodLabel = searching
    ? 'em todos os meses'
    : month === 'all'
      ? 'em todos os meses'
      : `em ${formatMonthKey(month)}`;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            Transações
          </h1>
          <p className="text-muted text-[12.5px] mt-1">
            Todas as suas movimentações financeiras
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center justify-center gap-2 bg-panel-strong border border-panel-border text-text px-4 py-3 sm:py-2.5 rounded-[10px] text-[12.5px] font-semibold w-full sm:w-auto transition hover:border-accent/60"
          >
            <Upload size={15} />
            Importar extrato
          </button>
          <button
            onClick={openCreateModal}
            title="Nova transação (N)"
            className="flex items-center justify-center gap-2 bg-accent text-bg px-4 py-3 sm:py-2.5 rounded-[10px] text-[12.5px] font-semibold w-full sm:w-auto"
          >
            <Plus size={15} />
            Nova transação
          </button>
        </div>
      </div>

      <QuickEntry categories={categories} onCreate={handleQuickCreate} inputRef={quickRef} />

      <div className="bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl p-4 md:p-6">
        {/* Navegação por mês + totais do período */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              disabled={!canPrev || searching}
              aria-label="Mês anterior"
              className="w-9 h-9 flex items-center justify-center rounded-[10px] text-muted hover:text-text hover:bg-panel-strong disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronLeft size={18} />
            </button>
            <h2
              className={`font-display text-[15px] sm:text-[17px] font-semibold tracking-tight whitespace-nowrap sm:min-w-[170px] text-center px-1 first-letter:uppercase ${
                searching ? 'text-muted' : ''
              }`}
              aria-live="polite"
            >
              {month === 'all' || searching ? 'Todos os meses' : formatMonthKey(month)}
            </h2>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={!canNext || searching}
              aria-label="Próximo mês"
              className="w-9 h-9 flex items-center justify-center rounded-[10px] text-muted hover:text-text hover:bg-panel-strong disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => setMonth(month === 'all' ? initialMonth(null, transactions) : 'all')}
              disabled={searching}
              className="ml-auto lg:ml-1 whitespace-nowrap text-[11.5px] text-muted hover:text-text px-2.5 py-1.5 rounded-full hover:bg-panel-strong transition disabled:opacity-30"
            >
              {month === 'all' ? 'Ver por mês' : 'Ver todos'}
            </button>
          </div>

          <dl className="grid grid-cols-3 gap-4 lg:gap-8 text-right lg:text-left">
            <div className="text-left">
              <dt className="text-[10.5px] text-muted">Entradas</dt>
              <dd className="money num text-[14px] font-semibold text-pos">
                {formatCurrency(totals.income)}
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-[10.5px] text-muted">Saídas</dt>
              <dd className="money num text-[14px] font-semibold">
                {formatCurrency(totals.expense)}
              </dd>
            </div>
            <div className="text-left">
              <dt className="text-[10.5px] text-muted">Saldo</dt>
              <dd
                className={`money num text-[14px] font-semibold ${
                  totals.net >= 0 ? 'text-text' : 'text-neg'
                }`}
              >
                {totals.net < 0 ? '-' : ''}
                {formatCurrency(Math.abs(totals.net))}
              </dd>
            </div>
          </dl>
        </div>

        {/* Busca e filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2 pb-4 border-b border-panel-border">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="transaction-search" className="sr-only">
              Buscar pela descrição
            </label>
            <input
              id="transaction-search"
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuery('');
                  e.currentTarget.blur();
                }
              }}
              placeholder="Buscar pela descrição"
              maxLength={100}
              className="w-full bg-panel-strong border border-panel-border rounded-[10px] pl-9 pr-10 py-2.5 text-[12.5px] text-text placeholder:text-muted outline-none transition focus:border-accent/60"
            />
            {!searching && (
              <kbd className="hidden md:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-2 border border-panel-border rounded px-1.5 py-0.5">
                B
              </kbd>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {selectedCategory && (
              <button
                type="button"
                onClick={clearCategory}
                className="flex items-center gap-1.5 text-[11.5px] md:text-[10.5px] pl-3 pr-2 py-1.5 md:py-1 rounded-full bg-accent text-bg font-semibold"
              >
                {selectedCategory.name}
                <X size={12} aria-hidden="true" />
                <span className="sr-only">(remover filtro de categoria)</span>
              </button>
            )}
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`text-[11.5px] md:text-[10.5px] px-3 py-1.5 md:px-2.5 md:py-1 rounded-full transition ${
                  filter === f.key
                    ? 'bg-panel-strong text-text'
                    : 'text-muted hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-text">
              {searching
                ? `Nenhuma transação com “${query.trim()}”.`
                : `Nenhuma transação ${periodLabel}.`}
            </p>
            <p className="text-[12px] text-muted mt-1">
              {searching
                ? 'Tente outra palavra ou limpe a busca.'
                : 'Use o lançamento rápido acima ou o botão Nova transação.'}
            </p>
          </div>
        ) : (
          <TransactionList
            transactions={filtered}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </div>

      <ImportStatement
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        categories={categories}
        existing={transactions}
      />

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        categories={categories}
        transaction={editingTransaction}
      />
    </div>
  );
}

export default Transactions;
