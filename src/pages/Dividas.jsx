import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import ProgressRing from '@/components/ui/ProgressRing';
import { toast } from 'sonner';

const formatCurrency = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const prioridadeCores = {
  'Alta': 'bg-red-100 text-red-700',
  'Média': 'bg-amber-100 text-amber-700',
  'Baixa': 'bg-green-100 text-green-700',
};

const statusCores = {
  'Em aberto': 'bg-slate-100 text-slate-700',
  'Pagando': 'bg-blue-100 text-blue-700',
  'Quitada': 'bg-emerald-100 text-emerald-700',
};

export default function Dividas() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome: '', total: '', pago: '', prioridade: 'Alta', status: 'Em aberto' });
  const queryClient = useQueryClient();

  const { data: dividas } = useQuery({
    queryKey: ['dividas'],
    queryFn: () => apiClient.entities.Divida.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (d) => apiClient.entities.Divida.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dividas'] }); closeForm(); toast.success('Dívida adicionada!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Divida.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dividas'] }); closeForm(); toast.success('Dívida atualizada!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Divida.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dividas'] }); toast.success('Dívida removida!'); },
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ nome: '', total: '', pago: '', prioridade: 'Alta', status: 'Em aberto' }); };

  const handleEdit = (d) => {
    setForm({ nome: d.nome, total: d.total, pago: d.pago || 0, prioridade: d.prioridade, status: d.status || 'Em aberto' });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = { nome: form.nome, total: Number(form.total), pago: Number(form.pago) || 0, prioridade: form.prioridade, status: form.status };
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const totalDividas = dividas.reduce((s, d) => s + (d.total || 0), 0);
  const totalPago = dividas.reduce((s, d) => s + (d.pago || 0), 0);

  return (
    <div>
      <PageHeader 
        title="Dívidas" 
        subtitle={`${dividas.length} dívidas registradas`}
        action={<Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Nova Dívida</Button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm text-center">
          <ProgressRing progress={totalDividas > 0 ? (totalPago / totalDividas) * 100 : 0} size={100} strokeWidth={8} />
          <p className="text-sm text-muted-foreground mt-3">Progresso Geral</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Total das Dívidas</p>
          <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(totalDividas)}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Já Pago</p>
          <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalPago)}</p>
          <p className="text-xs text-muted-foreground mt-1">Restante: {formatCurrency(totalDividas - totalPago)}</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dividas.map((d, i) => {
          const restante = (d.total || 0) - (d.pago || 0);
          const progress = d.total > 0 ? (d.pago / d.total) * 100 : 0;
          return (
            <motion.div 
              key={d.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 border border-border shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{d.nome}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioridadeCores[d.prioridade] || ''}`}>{d.prioridade}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCores[d.status] || statusCores['Em aberto']}`}>{d.status || 'Em aberto'}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(d)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(d.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatCurrency(d.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pago</span>
                  <span className="font-semibold text-primary">{formatCurrency(d.pago)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground text-right">{formatCurrency(restante)} restante</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Dívida' : 'Nova Dívida'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            <Input type="number" placeholder="Valor total" value={form.total} onChange={e => setForm({...form, total: e.target.value})} />
            <Input type="number" placeholder="Valor pago" value={form.pago} onChange={e => setForm({...form, pago: e.target.value})} />
            <Select value={form.prioridade} onValueChange={v => setForm({...form, prioridade: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Em aberto">Em aberto</SelectItem>
                <SelectItem value="Pagando">Pagando</SelectItem>
                <SelectItem value="Quitada">Quitada</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">
              <Check className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

