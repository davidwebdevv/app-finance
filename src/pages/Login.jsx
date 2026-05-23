import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const action = mode === 'register' ? apiClient.auth.register : apiClient.auth.login;
      await action({ email, password, name: mode === 'register' ? name : undefined });
      window.location.href = redirectTo;
    } catch (error) {
      toast.error(error?.message || 'Falha ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === 'register' ? 'Criar conta' : 'Entrar no app'}</CardTitle>
          <CardDescription>
            {mode === 'register'
              ? 'Use um email e senha para manter seus dados sincronizados entre dispositivos.'
              : 'Faça login para acessar seus dados no backend e poder usar o app no celular e no computador.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {mode === 'register' ? 'Criar conta' : 'Entrar'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            {mode === 'register'
              ? 'Já tem conta?'
              : 'Ainda não tem conta?'}
            <button
              type="button"
              className="font-semibold text-primary ml-2"
              onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
            >
              {mode === 'register' ? 'Entrar' : 'Criar conta'}
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            Os dados do app serão guardados no backend para sincronização entre dispositivos.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
