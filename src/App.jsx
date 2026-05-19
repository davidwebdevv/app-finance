import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import FluxoMensal from './pages/FluxoMensal';
import Dividas from './pages/Dividas';
import Investimentos from './pages/Investimentos';
import Metas from './pages/Metas';
import AcademiaDieta from './pages/AcademiaDieta';
import MiniIndice from './pages/MiniIndice';
import Rotina from './pages/Rotina';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">M</span>
          </div>
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/fluxo" element={<FluxoMensal />} />
        <Route path="/dividas" element={<Dividas />} />
        <Route path="/investimentos" element={<Investimentos />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/academia" element={<AcademiaDieta />} />
        <Route path="/mini-indice" element={<MiniIndice />} />
        <Route path="/rotina" element={<Rotina />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App