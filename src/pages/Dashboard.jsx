import React from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingDown, Home, UtensilsCrossed, Wallet, CreditCard, PiggyBank, TrendingUp, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import ProgressRing from '@/components/ui/ProgressRing';

const formatCurrency = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { data: configs } = useQuery({
    queryKey: ['configs'],
    queryFn: () => apiClient.entities.ConfigFinanceira.list(),
    initialData: [],
  });

  const { data: dividas } = useQuery({
    queryKey: ['dividas'],
    queryFn: () => apiClient.entities.Divida.list(),
    initialData: [],
  });

  const { data: fluxo } = useQuery({
    queryKey: ['fluxo'],
    queryFn: () => apiClient.entities.FluxoDiario.list(),
    initialData: [],
  });

  const { data: investimentos } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => apiClient.entities.Investimento.list(),
    initialData: [],
  });

  const { data: metas } = useQuery({
    queryKey: ['metas'],
    queryFn: () => apiClient.entities.Meta.list(),
    initialData: [],
  });

  const cfg = configs[0] || {
    receita_mensal: 6000, custos_operacionais: 2020, contas_fixas: 1540,
    alimentacao: 1000, livre: 0, dividas: 0, reserva: 0, investimentos: 0, lazer: 0
  };

  const totalDividas = dividas.reduce((s, d) => s + (d.total || 0), 0);
  const totalPago = dividas.reduce((s, d) => s + (d.pago || 0), 0);
  const totalGastos = cfg.custos_operacionais + cfg.contas_fixas + cfg.alimentacao;
  const saldoLivre = cfg.receita_mensal - totalGastos;

  const receitaReal = fluxo.reduce((s, f) => s + (f.receita || 0), 0);
  const reservaInvestimentos = investimentos.reduce((s, inv) => s + (inv.reserva || 0), 0);
  const metasConcluidas = metas.filter((m) => m.concluido).length;
  const totalMetas = metas.length;
  const metasValorTotal = metas.reduce((s, m) => s + (m.valor || 0), 0);

  const pieData = [
    { name: 'Operacional', value: cfg.custos_operacionais, color: '#f59e0b' },
    { name: 'Contas Fixas', value: cfg.contas_fixas, color: '#3b82f6' },
    { name: 'Alimentação', value: cfg.alimentacao, color: '#10b981' },
    { name: 'Livre', value: Math.max(saldoLivre, 0), color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral das suas finanças" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Receita Mensal" value={formatCurrency(cfg.receita_mensal)} icon={DollarSign} color="green" />
        <StatCard title="Custos Operacionais" value={formatCurrency(cfg.custos_operacionais)} icon={TrendingDown} color="amber" />
        <StatCard title="Contas Fixas" value={formatCurrency(cfg.contas_fixas)} icon={Home} color="blue" />
        <StatCard title="Alimentação" value={formatCurrency(cfg.alimentacao)} icon={UtensilsCrossed} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pie chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-sm lg:col-span-2"
        >
          <h3 className="font-semibold text-foreground mb-4">Distribuição de Gastos</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Saldo card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center justify-center"
        >
          <h3 className="font-semibold text-foreground mb-4">Saldo Disponível</h3>
          <ProgressRing 
            progress={(saldoLivre / cfg.receita_mensal) * 100} 
            size={120} 
            strokeWidth={8}
            color={saldoLivre >= 0 ? 'hsl(160, 84%, 39%)' : 'hsl(0, 72%, 51%)'}
          />
          <p className={`text-2xl font-bold mt-4 ${saldoLivre >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(saldoLivre)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">após gastos fixos</p>
        </motion.div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-red-50">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold">Dívidas</h3>
          </div>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDividas - totalPago)}</p>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all" 
              style={{ width: `${totalDividas > 0 ? (totalPago / totalDividas) * 100 : 0}%` }} 
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalPago)} pago de {formatCurrency(totalDividas)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-5 border border-border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-sky-50">
              <Wallet className="w-5 h-5 text-sky-600" />
            </div>
            <h3 className="font-semibold">Reserva Investimentos</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(reservaInvestimentos)}</p>
          <p className="text-xs text-muted-foreground mt-1">total em reservas</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl p-5 border border-border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold">Metas</h3>
          </div>
          <p className="text-2xl font-bold">{metasConcluidas}/{totalMetas}</p>
          <p className="text-xs text-muted-foreground mt-1">concluídas de {totalMetas}</p>
          {totalMetas > 0 && <p className="text-xs text-muted-foreground mt-1">R$ {metasValorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em objetivos</p>}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl p-5 border border-border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-green-50">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold">Receita Real</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(receitaReal)}</p>
          <p className="text-xs text-muted-foreground mt-1">receita registrada no mês</p>
        </motion.div>
      </div>
    </div>
  );
}

