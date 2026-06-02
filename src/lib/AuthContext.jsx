import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

const STORAGE_KEY = 'app_financeiro:user';
const PROFILE_NAME_KEY = 'app_financeiro:profile_name';

const getStoredProfileName = () => {
  try {
    return String(localStorage.getItem(PROFILE_NAME_KEY) || '').trim();
  } catch {
    return '';
  }
};

const persistProfileName = (value) => {
  try {
    if (value) {
      localStorage.setItem(PROFILE_NAME_KEY, String(value).trim());
    } else {
      localStorage.removeItem(PROFILE_NAME_KEY);
    }
  } catch {
    // ignora falha local
  }
};

const getDisplayName = (user) => {
  if (!user) return getStoredProfileName() || 'Usuário';

  const metadataName = user?.user_metadata?.name || user?.user_metadata?.full_name;
  if (metadataName) return String(metadataName).trim();

  if (getStoredProfileName()) return getStoredProfileName();

  if (user?.email) return user.email.split('@')[0];

  return 'Usuário';
};

const persistUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user ?? null));
  } catch {
    // ignora falha local
  }
};

export function AuthProvider({
  children,
}) {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(null);

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(false);

  const [
    isLoadingAuth,
    setIsLoadingAuth,
  ] = useState(true);

  const [authChecked, setAuthChecked] =
    useState(false);

  useEffect(() => {
    async function loadUser() {
      setIsLoadingAuth(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        persistUser(user);
        setUser(user);
        setIsAuthenticated(true);
      } else {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
          if (saved) {
            setUser(saved);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch {
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setAuthChecked(true);
      setIsLoadingAuth(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;

        persistUser(currentUser);
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
        setAuthChecked(true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Falha ao encerrar sessão no Supabase:', error);
    } finally {
      persistUser(null);
      persistProfileName('');
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      toast.success('Logout realizado com sucesso.');
      navigate('/login', {
        replace: true,
      });
    }
  }

  function navigateToLogin() {
    navigate('/login', {
      replace: true,
    });
  }

  async function checkUserAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      persistUser(user ?? null);
      setUser(user ?? null);
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    } catch (error) {
      console.warn('Falha ao validar sessão:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        displayName: getDisplayName(user),
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}