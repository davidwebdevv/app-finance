import { useAuth } from '@/lib/AuthContext';

export default function UserNotRegisteredError() {
  const { logout, navigateToLogin } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <span className="text-xl font-bold">!</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Usuário não cadastrado</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seu login foi autenticado, mas este usuário ainda não está cadastrado no sistema.
              Entre novamente ou fale com o administrador para liberar o acesso.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => navigateToLogin()}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-90"
            >
              Ir para o login
            </button>

            <button
              onClick={() => logout()}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
