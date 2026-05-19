import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function AcademiaDieta() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ semana: '', ano: new Date().getFullYear(), peso: '', treinos: '', kcal_media: '', observacoes: '' });
  const queryClient = useQueryClient();

  const { data: registros } = useQuery({
    queryKey: ['academia'],
    queryFn: () => apiClient.entities.AcademiaDieta.list('semana'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (d) => apiClient.entities.AcademiaDieta.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academia'] }); closeForm(); toast.success('Semana registrada!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.AcademiaDieta.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academia'] }); closeForm(); toast.success('Registro atualizado!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.AcademiaDieta.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academia'] }); toast.success('Registro removido!'); },
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ semana: '', ano: new Date().getFullYear(), peso: '', treinos: '', kcal_media: '', observacoes: '' }); };

  const handleEdit = (r) => {
    setForm({ semana: r.semana, ano: r.ano, peso: r.peso || '', treinos: r.treinos || '', kcal_media: r.kcal_media || '', observacoes: r.observacoes || '' });
    setEditId(r.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = { semana: Number(form.semana), ano: Number(form.ano), peso: Number(form.peso) || undefined, treinos: Number(form.treinos) || 0, kcal_media: Number(form.kcal_media) || undefined, observacoes: form.observacoes };
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const pesoData = registros.filter(r => r.peso).map(r => ({ semana: `S${r.semana}`, peso: r.peso }));
  const lastPeso = pesoData.length > 0 ? pesoData[pesoData.length - 1].peso : null;
  const avgTreinos = registros.length > 0 ? (registros.reduce((s, r) => s + (r.treinos || 0), 0) / registros.length).toFixed(1) : '0';

  return (
    <div>
      <PageHeader 
        title="Academia & Dieta" 
        subtitle="Acompanhamento semanal"
        action={<Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Nova Semana</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Peso Atual</p>
          <p className="text-2xl font-bold mt-1">{lastPeso ? `${lastPeso} kg` : '—'}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Média de Treinos/Semana</p>
          <p className="text-2xl font-bold mt-1 text-primary">{avgTreinos}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Semanas Registradas</p>
          <p className="text-2xl font-bold mt-1">{registros.length}</p>
        </div>
      </div>

      {pesoData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-8">
          <h3 className="font-semibold mb-4">Evolução do Peso</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pesoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="peso" stroke="hsl(160, 84%, 39%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Semana</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Peso (kg)</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Treinos</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Kcal Média</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Obs</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">Semana {r.semana}</td>
                  <td className="p-4 text-right">{r.peso ? `${r.peso} kg` : '—'}</td>
                  <td className="p-4 text-right text-primary font-medium">{r.treinos || 0}</td>
                  <td className="p-4 text-right">{r.kcal_media || '—'}</td>
                  <td className="p-4 text-muted-foreground text-sm max-w-[200px] truncate">{r.observacoes || '—'}</td>
                  <td className="p-4 flex gap-1">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-muted"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => deleteMutation.mutate(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                  </td>
                </tr>
              ))}
              {registros.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum registro.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Semana</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input type="number" placeholder="Semana (1-52)" value={form.semana} onChange={e => setForm({...form, semana: e.target.value})} />
            <Input type="number" placeholder="Peso (kg)" value={form.peso} onChange={e => setForm({...form, peso: e.target.value})} />
            <Input type="number" placeholder="Treinos na semana" value={form.treinos} onChange={e => setForm({...form, treinos: e.target.value})} />
            <Input type="number" placeholder="Kcal média" value={form.kcal_media} onChange={e => setForm({...form, kcal_media: e.target.value})} />
            <Textarea placeholder="Observações" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} />
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90"><Check className="w-4 h-4 mr-2" /> Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

