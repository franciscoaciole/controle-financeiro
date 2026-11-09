// Bloco cinza que pulsa no lugar do conteúdo enquanto os dados carregam
export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-panel-strong animate-pulse motion-reduce:animate-none ${
        className.includes('rounded') ? '' : 'rounded-md'
      } ${className}`}
    />
  );
}

export function Panel({ children, className = '' }) {
  return (
    <div className={`bg-panel border border-panel-border rounded-[18px] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

// Esqueleto do Dashboard: mesma grade da tela real, para nada "pular" ao carregar
export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col" role="status" aria-label="Carregando o painel">
      <div className="mb-6 md:mb-8">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3 w-56 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-4 md:gap-[18px] mb-4 md:mb-[18px]">
        <Panel className="p-5 md:p-[26px_28px] lg:min-h-[250px] flex flex-col justify-between">
          <div>
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-10 w-64 max-w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </Panel>
        <Panel className="p-5 md:p-[22px_24px] flex flex-col">
          <Skeleton className="h-3 w-32 mb-5" />
          <div className="flex items-center gap-5">
            <Skeleton className="w-[104px] h-[104px] rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        </Panel>
      </div>
      <Panel className="p-5 md:p-6 min-h-[300px]">
        <Skeleton className="h-3 w-32 mb-6" />
        <Skeleton className="h-[220px]" />
      </Panel>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-[10px] shrink-0" />
          <Skeleton className="h-3 flex-1 max-w-[260px]" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div role="status" aria-label="Carregando as transações">
      <div className="mb-6 md:mb-8">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3 w-60 mt-2" />
      </div>
      <Panel className="p-4 md:p-5 mb-4 md:mb-6">
        <Skeleton className="h-10" />
      </Panel>
      <Panel className="p-4 md:p-6">
        <Skeleton className="h-4 w-40 mb-6" />
        <ListSkeleton />
      </Panel>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div role="status" aria-label="Carregando as categorias">
      <div className="mb-8">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3 w-52 mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Panel key={i} className="p-4">
            <Skeleton className="w-9 h-9 rounded-full mb-4" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-14 mt-2" />
          </Panel>
        ))}
      </div>
    </div>
  );
}
