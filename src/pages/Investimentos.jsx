import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const formatCurrency = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function Investimentos() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ mes: 'Jan', ano: new Date().getFullYear(), reserva: '', dividendos: '', acoes: '', objetivo: '' });
  const queryClient = useQueryClient();

  const { data: investimentos } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => apiClient.entities.Investimento.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (d) => apiClient.entities.Investimento.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['investimentos'] }); closeForm(); toast.success('Registro adicionado!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Investimento.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['investimentos'] }); closeForm(); toast.success('Registro atualizado!'); },
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ mes: 'Jan', ano: new Date().getFullYear(), reserva: '', dividendos: '', acoes: '', objetivo: '' }); };

  const handleEdit = (inv) => {
    setForm({ mes: inv.mes, ano: inv.ano, reserva: inv.reserva || '', dividendos: inv.dividendos || '', acoes: inv.acoes || '', objetivo: inv.objetivo || '' });
    setEditId(inv.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = { mes: form.mes, ano: Number(form.ano), reserva: Number(form.reserva) || 0, dividendos: Number(form.dividendos) || 0, acoes: Number(form.acoes) || 0, objetivo: form.objetivo };
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const sortedInv = [...investimentos].sort((a, b) => MESES.indexOf(a.mes) - MESES.indexOf(b.mes));
  const totalReserva = investimentos.reduce((s, i) => s + (i.reserva || 0), 0);
  const totalDividendos = investimentos.reduce((s, i) => s + (i.dividendos || 0), 0);
  const totalAcoes = investimentos.reduce((s, i) => s + (i.acoes || 0), 0);

  return (
    <div>
      <PageHeader 
        title="Investimentos" 
        subtitle="Acompanhe suas reservas e investimentos"
        action={<Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Novo Registro</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Reserva Total', value: totalReserva, color: 'text-primary' },
          { label: 'Dividendos', value: totalDividendos, color: 'text-blue-600' },
          { label: 'Ações', value: totalAcoes, color: 'text-purple-600' },
        ].map(item => (
          <div key={item.label} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {sortedInv.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-8">
          <h3 className="font-semibold mb-4">Evolução</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={sortedInv}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="reserva" stroke="hsl(160, 84%, 39%)" fill="hsl(160, 84%, 39%)" fillOpacity={0.1} />
              <Area type="monotone" dataKey="dividendos" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="acoes" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Mês</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Reserva</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Dividendos</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Objetivo</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {sortedInv.map(inv => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{inv.mes}/{inv.ano}</td>
                  <td className="p-4 text-right text-primary font-medium">{formatCurrency(inv.reserva)}</td>
                  <td className="p-4 text-right text-blue-600">{formatCurrency(inv.dividendos)}</td>
                  <td className="p-4 text-right text-purple-600">{formatCurrency(inv.acoes)}</td>
                  <td className="p-4 text-muted-foreground">{inv.objetivo || '—'}</td>
                  <td className="p-4">
                    <button onClick={() => handleEdit(inv)} className="p-1.5 rounded-lg hover:bg-muted">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedInv.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum investimento registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar' : 'Novo'} Investimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={form.mes} onValueChange={v => setForm({...form, mes: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MESES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="Ano" value={form.ano} onChange={e => setForm({...form, ano: e.target.value})} />
            <Input type="number" placeholder="Reserva" value={form.reserva} onChange={e => setForm({...form, reserva: e.target.value})} />
            <Input type="number" placeholder="Dividendos" value={form.dividendos} onChange={e => setForm({...form, dividendos: e.target.value})} />
            <Input type="number" placeholder="Ações" value={form.acoes} onChange={e => setForm({...form, acoes: e.target.value})} />
            <Input placeholder="Objetivo" value={form.objetivo} onChange={e => setForm({...form, objetivo: e.target.value})} />
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90"><Check className="w-4 h-4 mr-2" /> Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

