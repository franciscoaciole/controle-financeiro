import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Receipt, Tags, LogOut } from 'lucide-react';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transações', icon: Receipt },
    { to: '/categories', label: 'Categorias', icon: Tags },
  ];

  return (
    <div className="flex min-h-screen bg-bg text-text font-sans">
      {/* Sidebar */}
      <aside className="w-[232px] flex-shrink-0 border-r border-panel-border p-[28px_18px] flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-[9px] px-2 pb-8">
          <div className="w-[26px] h-[26px] rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-bg font-display font-bold text-xs">F+</span>
          </div>
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

        {/* Footer: usuário + logout */}
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-[10px] p-[10px] rounded-xl bg-panel border border-panel-border">
            <div className="w-8 h-8 rounded-[9px] bg-[#232228] flex items-center justify-center font-display font-semibold text-xs text-accent flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
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

      {/* Conteúdo principal */}
      <main className="flex-1 px-10 py-7 max-w-[1280px]">{children}</main>
    </div>
  );
}

export default Layout;