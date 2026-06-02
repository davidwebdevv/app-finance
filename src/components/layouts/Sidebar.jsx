import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ArrowLeftRight, CreditCard, TrendingUp, 
  Target, Dumbbell, BarChart3, Calendar, Menu, X, LogOut
} from 'lucide-react';
//import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/fluxo', label: 'Fluxo Mensal', icon: ArrowLeftRight },
  { path: '/dividas', label: 'Dívidas', icon: CreditCard },
  { path: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { path: '/metas', label: 'Metas', icon: Target },
  { path: '/academia', label: 'Academia & Dieta', icon: Dumbbell },
  { path: '/mini-indice', label: 'Mini Índice', icon: BarChart3 },
  { path: '/rotina', label: 'Rotina', icon: Calendar },
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user, displayName } = useAuth();

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">Máximo</h1>
            <p className="text-xs text-sidebar-foreground/50">Planejamento Financeiro</p>
            <p className="text-[11px] text-sidebar-foreground/80 truncate font-medium">Olá, {displayName}</p>
            {user?.email && <p className="text-[11px] text-sidebar-foreground/60 truncate">{user.email}</p>}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card shadow-lg border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full bg-sidebar flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 h-screen bg-sidebar flex-col fixed left-0 top-0 border-r border-sidebar-border">
        <NavContent />
      </aside>
    </>
  );
}

