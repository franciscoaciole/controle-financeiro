import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LayoutDashboard, Receipt, Tags, LogOut, Eye, EyeOff, Keyboard } from 'lucide-react';
import { toggleHidden } from '../lib/privacy';
import { shortcutFor } from '../lib/shortcuts';
import { useHideValues } from '../hooks/useHideValues';
import ShortcutsHelp from './ShortcutsHelp';

// Botão do olho: esconde ou mostra todos os valores em reais
function PrivacyButton({ className = '', showLabel = false }) {
  const hidden = useHideValues();
  const label = hidden ? 'Mostrar valores' : 'Esconder valores';
  const Icon = hidden ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={toggleHidden}
      aria-pressed={hidden}
      aria-label={showLabel ? undefined : label}
      title={`${label} (H)`}
      className={`flex items-center gap-2 text-muted hover:text-text transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-lg ${className}`}
    >
      <Icon size={showLabel ? 14 : 17} />
      {showLabel && label}
    </button>
  );
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  // Atalhos de teclado do app inteiro
  useEffect(() => {
    function handleKeyDown(e) {
      const modalOpen = Boolean(document.querySelector('[role="dialog"]'));
      const action = shortcutFor(e, { modalOpen });
      if (!action) return;
      e.preventDefault();

      if (action === 'toggle-values') toggleHidden();
      else if (action === 'help') setHelpOpen(true);
      else navigate('/transactions', { state: { action } });
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const navItems = [
    { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transações', icon: Receipt },
    { to: '/categories', label: 'Categorias', icon: Tags },
  ];

  // Título da aba por página: ajuda no histórico, nas abas e em leitores de tela
  const pageLabel = navItems.find((item) => item.to === location.pathname)?.label;
  useEffect(() => {
    document.title = pageLabel ? `${pageLabel} · Finan+` : 'Finan+';
  }, [pageLabel]);

  const initial = user?.name?.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-bg text-text font-sans">
      {/* Sidebar: só em telas médias pra cima */}
      <aside className="hidden md:flex w-[232px] flex-shrink-0 border-r border-panel-border p-[28px_18px] flex-col">
        {/* Brand */}
        <div className="flex items-center gap-[9px] px-2 pb-8">
          <img src="/logo.jpg" alt="Finan+" className="w-9 h-9 flex-shrink-0 mix-blend-screen" />
          <span className="font-display font-semibold text-[16.5px] tracking-tight">
            Finan+
          </span>
        </div>

        {/* Navegação */}
        <nav className="flex flex-col gap-0.5 mb-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-[11px] px-[10px] py-[9px] rounded-[10px] text-[13px] font-medium relative ${
                  isActive
                    ? 'bg-panel-strong text-text'
                    : 'text-muted hover:text-text'
                }`}
              >
                {isActive && (
                  <span className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent rounded-full" />
                )}
                <Icon size={16} className={isActive ? 'text-accent' : 'text-muted'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: preferências, usuário e logout */}
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex flex-col gap-0.5 mb-1">
            <PrivacyButton showLabel className="px-[10px] py-2 text-[12.5px]" />
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              title="Atalhos do teclado (?)"
              className="flex items-center gap-2 px-[10px] py-2 rounded-lg text-[12.5px] text-muted hover:text-text transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <Keyboard size={14} />
              Atalhos do teclado
            </button>
          </div>
          <div className="flex items-center gap-[10px] p-[10px] rounded-xl bg-panel border border-panel-border">
            <div className="w-8 h-8 rounded-[9px] bg-[#232228] flex items-center justify-center font-display font-semibold text-xs text-accent flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10.5px] text-muted">Conta pessoal</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-[10px] py-2 rounded-lg text-[12.5px] text-muted hover:text-neg transition"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </aside>

      {/* Coluna principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barra do topo: só no celular */}
        <header
          className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 pb-3 bg-bg/90 backdrop-blur-xl border-b border-panel-border"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center gap-[9px]">
            <img src="/logo.jpg" alt="Finan+" className="w-8 h-8 mix-blend-screen" />
            <span className="font-display font-semibold text-[16px] tracking-tight">
              Finan+
            </span>
          </div>

          <div className="flex items-center gap-1">
            <PrivacyButton className="w-9 h-9 justify-center" />
            <div className="w-8 h-8 rounded-[9px] bg-panel-strong flex items-center justify-center font-display font-semibold text-xs text-accent">
              {initial}
            </div>
            <button
              onClick={logout}
              aria-label="Sair"
              className="w-9 h-9 flex items-center justify-center text-muted hover:text-neg transition"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex flex-1 flex-col min-w-0 w-full max-w-[1280px] px-4 pt-5 pb-28 md:px-10 md:py-7">
          {children}
        </main>
      </div>

      {/* Navegação de baixo: só no celular */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg/90 backdrop-blur-xl border-t border-panel-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-accent' : 'text-muted'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <ShortcutsHelp isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default Layout;
