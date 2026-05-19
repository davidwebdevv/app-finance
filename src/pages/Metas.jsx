import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Edit2, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import ProgressRing from '@/components/ui/ProgressRing';
import { toast } from 'sonner';

const formatCurrency = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function Metas() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ categoria: '', meta: '', valor: '', valor_atual: '', prazo: '', concluido: false });
  const queryClient = useQueryClient();

  const { data: metas } = useQuery({
    queryKey: ['metas'],
    queryFn: () => apiClient.entities.Meta.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (d) => apiClient.entities.Meta.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['metas'] }); closeForm(); toast.success('Meta adicionada!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Meta.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['metas'] }); closeForm(); toast.success('Meta atualizada!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Meta.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['metas'] }); toast.success('Meta removida!'); },
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ categoria: '', meta: '', valor: '', valor_atual: '', prazo: '', concluido: false }); };

  const handleEdit = (m) => {
    setForm({ categoria: m.categoria, meta: m.meta, valor: m.valor || '', valor_atual: m.valor_atual || '', prazo: m.prazo || '', concluido: m.concluido || false });
    setEditId(m.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = { categoria: form.categoria, meta: form.meta, valor: Number(form.valor) || 0, valor_atual: Number(form.valor_atual) || 0, prazo: form.prazo || undefined, concluido: form.concluido };
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const toggleConcluido = (m) => {
    updateMutation.mutate({ id: m.id, data: { concluido: !m.concluido } });
  };

  const concluidas = metas.filter(m => m.concluido).length;

  return (
    <div>
      <PageHeader 
        title="Metas" 
        subtitle={`${concluidas}/${metas.length} concluídas`}
        action={<Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Nova Meta</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metas.map((m, i) => {
          const progress = m.valor > 0 ? Math.min((m.valor_atual / m.valor) * 100, 100) : 0;
          return (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card rounded-2xl p-5 border shadow-sm transition-all ${m.concluido ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Checkbox checked={m.concluido} onCheckedChange={() => toggleConcluido(m)} />
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{m.categoria}</span>
                    <h3 className={`font-semibold mt-1 ${m.concluido ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{m.meta}</h3>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(m)} className="p-1.5 rounded-lg hover:bg-muted"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => deleteMutation.mutate(m.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  {m.valor > 0 && (
                    <>
                      <p className="text-lg font-bold">{formatCurrency(m.valor_atual)}</p>
                      <p className="text-xs text-muted-foreground">de {formatCurrency(m.valor)}</p>
                    </>
                  )}
                  {m.prazo && <p className="text-xs text-muted-foreground mt-1">Prazo: {m.prazo}</p>}
                </div>
                {m.valor > 0 && <ProgressRing progress={progress} size={60} strokeWidth={5} color={m.concluido ? 'hsl(160, 84%, 39%)' : 'hsl(var(--primary))'} />}
                {m.concluido && !m.valor && <Trophy className="w-8 h-8 text-primary" />}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Meta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Categoria (ex: PC, Cachorro)" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} />
            <Input placeholder="Meta (ex: Upgrade, Reserva)" value={form.meta} onChange={e => setForm({...form, meta: e.target.value})} />
            <Input type="number" placeholder="Valor alvo (R$)" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
            <Input type="number" placeholder="Valor atual (R$)" value={form.valor_atual} onChange={e => setForm({...form, valor_atual: e.target.value})} />
            <Input type="date" placeholder="Prazo" value={form.prazo} onChange={e => setForm({...form, prazo: e.target.value})} />
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90"><Check className="w-4 h-4 mr-2" /> Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

