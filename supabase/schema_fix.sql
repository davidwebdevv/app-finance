-- Execute este script no SQL Editor do Supabase.
-- Ele cria/ajusta as tabelas usadas pelo app e libera acesso para usuários autenticados.

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia INTEGER DEFAULT 1,
  mes TEXT NOT NULL,
  receita NUMERIC DEFAULT 0,
  gasto NUMERIC DEFAULT 0,
  categoria TEXT DEFAULT 'Alimentação',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  pago NUMERIC NOT NULL DEFAULT 0,
  prioridade TEXT DEFAULT 'Alta',
  status TEXT DEFAULT 'Em aberto',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semana INTEGER DEFAULT 1,
  ano INTEGER DEFAULT EXTRACT(YEAR FROM now()),
  peso NUMERIC DEFAULT 0,
  treinos INTEGER DEFAULT 0,
  kcal_media NUMERIC DEFAULT 0,
  observacoes TEXT,
  plano_dieta TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mini_indice_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data TEXT,
  contratos NUMERIC DEFAULT 0,
  pts NUMERIC DEFAULT 0,
  resultado NUMERIC DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS dia INTEGER DEFAULT 1;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS mes TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receita NUMERIC DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS gasto NUMERIC DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Alimentação';

ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS pago NUMERIC DEFAULT 0;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'Alta';
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Em aberto';

ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS semana INTEGER DEFAULT 1;
ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS ano INTEGER DEFAULT EXTRACT(YEAR FROM now());
ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS peso NUMERIC DEFAULT 0;
ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS treinos INTEGER DEFAULT 0;
ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS kcal_media NUMERIC DEFAULT 0;
ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS plano_dieta TEXT;

ALTER TABLE public.mini_indice_trades ADD COLUMN IF NOT EXISTS data TEXT;
ALTER TABLE public.mini_indice_trades ADD COLUMN IF NOT EXISTS contratos NUMERIC DEFAULT 0;
ALTER TABLE public.mini_indice_trades ADD COLUMN IF NOT EXISTS pts NUMERIC DEFAULT 0;
ALTER TABLE public.mini_indice_trades ADD COLUMN IF NOT EXISTS resultado NUMERIC DEFAULT 0;
ALTER TABLE public.mini_indice_trades ADD COLUMN IF NOT EXISTS observacao TEXT;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_indice_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_all_authenticated" ON public.transactions;
CREATE POLICY "transactions_all_authenticated"
  ON public.transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_all_authenticated" ON public.debts;
CREATE POLICY "debts_all_authenticated"
  ON public.debts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "diet_plans_all_authenticated" ON public.diet_plans;
CREATE POLICY "diet_plans_all_authenticated"
  ON public.diet_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mini_indice_trades_all_authenticated" ON public.mini_indice_trades;
CREATE POLICY "mini_indice_trades_all_authenticated"
  ON public.mini_indice_trades
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mini_indice_trades TO authenticated;
