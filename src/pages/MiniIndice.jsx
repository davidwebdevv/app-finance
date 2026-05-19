import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { format } from 'date-fns';

const formatCurrency = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function MiniIndice() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ data: '', contratos: '', pts: '', resultado: '', observacao: '' });
  const queryClient = useQueryClient();

  const { data: operacoes } = useQuery({
    queryKey: ['miniindice'],
    queryFn: () => apiClient.entities.MiniIndice.list('-data'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (d) => apiClient.entities.MiniIndice.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['miniindice'] }); closeForm(); toast.success('Operação registrada!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.MiniIndice.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['miniindice'] }); closeForm(); toast.success('Operação atualizada!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.MiniIndice.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['miniindice'] }); toast.success('Operação removida!'); },
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ data: '', contratos: '', pts: '', resultado: '', observacao: '' }); };

  const handleEdit = (op) => {
    setForm({ data: op.data, contratos: op.contratos || '', pts: op.pts || '', resultado: op.resultado || '', observacao: op.observacao || '' });
    setEditId(op.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = { data: form.data, contratos: Number(form.contratos) || 0, pts: Number(form.pts) || 0, resultado: Number(form.resultado) || 0, observacao: form.observacao };
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const totalResultado = operacoes.reduce((s, op) => s + (op.resultado || 0), 0);
  const positivas = operacoes.filter(op => (op.resultado || 0) > 0).length;
  const taxaAcerto = operacoes.length > 0 ? ((positivas / operacoes.length) * 100).toFixed(0) : 0;

  const chartData = [...operacoes].reverse().slice(-20).map(op => ({
    data: op.data ? format(new Date(op.data), 'dd/MM') : '',
    resultado: op.resultado || 0,
  }));

  return (
    <div>
      <PageHeader 
        title="Mini Índice" 
        subtitle="Operações de day trade"
        action={<Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Nova Operação</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Resultado Total</p>
          <p className={`text-2xl font-bold mt-1 ${totalResultado >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(totalResultado)}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
          <p className="text-2xl font-bold mt-1">{taxaAcerto}%</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Total de Operações</p>
          <p className="text-2xl font-bold mt-1">{operacoes.length}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-8">
          <h3 className="font-semibold mb-4">Últimas Operações</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="resultado" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.resultado >= 0 ? 'hsl(160, 84%, 39%)' : 'hsl(0, 72%, 51%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Data</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Contratos</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Pts</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Resultado</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Obs</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {operacoes.map(op => (
                <tr key={op.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{op.data ? format(new Date(op.data), 'dd/MM/yyyy') : '—'}</td>
                  <td className="p-4 text-right">{op.contratos || 0}</td>
                  <td className="p-4 text-right">{op.pts || 0}</td>
                  <td className={`p-4 text-right font-semibold ${(op.resultado || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(op.resultado)}</td>
                  <td className="p-4 text-muted-foreground text-sm max-w-[200px] truncate">{op.observacao || '—'}</td>
                  <td className="p-4 flex gap-1">
                    <button onClick={() => handleEdit(op)} className="p-1.5 rounded-lg hover:bg-muted"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => deleteMutation.mutate(op.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                  </td>
                </tr>
              ))}
              {operacoes.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma operação registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Operação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
            <Input type="number" placeholder="Contratos" value={form.contratos} onChange={e => setForm({...form, contratos: e.target.value})} />
            <Input type="number" placeholder="Pontos" value={form.pts} onChange={e => setForm({...form, pts: e.target.value})} />
            <Input type="number" placeholder="Resultado (R$)" value={form.resultado} onChange={e => setForm({...form, resultado: e.target.value})} />
            <Input placeholder="Observação" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})} />
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90"><Check className="w-4 h-4 mr-2" /> Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

