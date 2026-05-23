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
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const normalizeText = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const NUMBER_WORDS = {
    um: 1, uma: 1, dois: 2, duas: 2, tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  };
  const FOOD_CALORIE_MAP = {
    banana: 89,
    maca: 52,
    'maça': 52,
    'maçã': 52,
    ovo: 78,
    'peito de frango': 165,
    frango: 165,
    arroz: 130,
    'batata assada': 161,
    aveia: 389,
    pao: 265,
    'pao frances': 135,
    queijo: 402,
    leite: 42,
    hamburguer: 250,
  };

  const parseFoodQuantity = (text) => {
    const normalized = normalizeText(text);
    const numberMatch = normalized.match(/(\d+(?:[\.,]\d+)?)/);
    if (numberMatch) {
      return Number(numberMatch[1].replace(',', '.'));
    }
    const wordMatch = normalized.match(new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join('|')})\\b`));
    if (wordMatch) {
      return NUMBER_WORDS[wordMatch[1]];
    }
    return null;
  };

  const estimateFoodCalories = (inputText) => {
    const normalized = normalizeText(inputText);
    const quantity = parseFoodQuantity(normalized) || 1;
    const foodKey = Object.keys(FOOD_CALORIE_MAP).find((key) => normalized.includes(normalizeText(key)));
    if (foodKey) {
      return FOOD_CALORIE_MAP[foodKey] * quantity;
    }
    return null;
  };

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ semana: '', ano: new Date().getFullYear(), peso: '', treinos: '', kcal_media: '', observacoes: '', plano_dieta: '' });
  const [mealForm, setMealForm] = useState({ data: todayISO(), horario: '', nome: '', descricao: '', quantidade: '', calorias: '' });
  const [weightForm, setWeightForm] = useState({ data: todayISO(), peso: '' });
  const [mealEstimating, setMealEstimating] = useState(false);
  const queryClient = useQueryClient();

  const { data: registros } = useQuery({
    queryKey: ['academia'],
    queryFn: () => apiClient.entities.AcademiaDieta.list('semana'),
    initialData: [],
  });

  const { data: mealEntries } = useQuery({
    queryKey: ['dieta-refeicoes'],
    queryFn: () => apiClient.entities.DietaRefeicoes.list('data'),
    initialData: [],
  });

  const { data: weightEntries } = useQuery({
    queryKey: ['peso-diario'],
    queryFn: () => apiClient.entities.PesoDiario.list('data'),
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

  const createMealMutation = useMutation({
    mutationFn: (data) => apiClient.entities.DietaRefeicoes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dieta-refeicoes'] });
      setMealForm({ data: todayISO(), horario: '', nome: '', descricao: '', quantidade: '', calorias: '' });
      toast.success('Refeição registrada!');
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: (id) => apiClient.entities.DietaRefeicoes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dieta-refeicoes'] });
      toast.success('Refeição removida!');
    },
  });

  const createWeightMutation = useMutation({
    mutationFn: (data) => apiClient.entities.PesoDiario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peso-diario'] });
      setWeightForm({ data: todayISO(), peso: '' });
      toast.success('Peso registrado!');
    },
  });

  const deleteWeightMutation = useMutation({
    mutationFn: (id) => apiClient.entities.PesoDiario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peso-diario'] });
      toast.success('Entrada de peso removida!');
    },
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ semana: '', ano: new Date().getFullYear(), peso: '', treinos: '', kcal_media: '', observacoes: '', plano_dieta: '' }); };

  const handleEdit = (r) => {
    setForm({ semana: r.semana, ano: r.ano, peso: r.peso || '', treinos: r.treinos || '', kcal_media: r.kcal_media || '', observacoes: r.observacoes || '', plano_dieta: r.plano_dieta || '' });
    setEditId(r.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const data = {
      semana: Number(form.semana),
      ano: Number(form.ano),
      peso: Number(form.peso) || undefined,
      treinos: Number(form.treinos) || 0,
      kcal_media: Number(form.kcal_media) || undefined,
      observacoes: form.observacoes,
      plano_dieta: form.plano_dieta,
    };
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const estimateCalories = async () => {
    setMealEstimating(true);
    const candidate = estimateFoodCalories(`${mealForm.quantidade} ${mealForm.nome} ${mealForm.descricao}`);
    if (candidate) {
      setMealForm({ ...mealForm, calorias: String(candidate) });
      toast.success('Calorias estimadas com base na refeição.');
    } else {
      toast.error('Não foi possível estimar. Use um valor manual ou descreva melhor o alimento.');
    }
    setMealEstimating(false);
  };

  const handleAddMeal = () => {
    if (!mealForm.data || !mealForm.nome) return;
    createMealMutation.mutate({
      ...mealForm,
      calorias: Number(mealForm.calorias) || undefined,
    });
  };

  const handleAddWeight = () => {
    if (!weightForm.data || !weightForm.peso) return;
    createWeightMutation.mutate({
      data: weightForm.data,
      peso: Number(weightForm.peso),
    });
  };

  const pesoData = registros.filter(r => r.peso).map(r => ({ semana: `S${r.semana}`, peso: r.peso }));
  const lastPeso = pesoData.length > 0 ? pesoData[pesoData.length - 1].peso : null;
  const lastDailyWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].peso : null;
  const pesoAtual = lastDailyWeight ?? lastPeso;
  const avgTreinos = registros.length > 0 ? (registros.reduce((s, r) => s + (r.treinos || 0), 0) / registros.length).toFixed(1) : '0';
  const caloriesToday = mealEntries.filter(m => m.data === todayISO()).reduce((sum, m) => sum + (m.calorias || 0), 0);
  const weightChartData = weightEntries.map(w => ({ data: w.data, peso: w.peso }));

  return (
    <div>
      <PageHeader 
        title="Academia & Dieta" 
        subtitle="Acompanhamento semanal"
        action={<Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> Nova Semana</Button>}
      />      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Peso Atual</p>
          <p className="text-2xl font-bold mt-1">{pesoAtual ? `${pesoAtual} kg` : '—'}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">Calorias Hoje</p>
          <p className="text-2xl font-bold mt-1 text-primary">{caloriesToday ? `${caloriesToday} kcal` : '0 kcal'}</p>
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
        </motion.div>      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold">Peso Diário</h3>
              <p className="text-sm text-muted-foreground">Registre seu peso diário para acompanhar o progresso de bulking.</p>
            </div>
            <Button onClick={handleAddWeight} className="bg-primary hover:bg-primary/90">Salvar</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input type="date" value={weightForm.data} onChange={e => setWeightForm({ ...weightForm, data: e.target.value })} />
            <Input type="number" placeholder="Peso (kg)" value={weightForm.peso} onChange={e => setWeightForm({ ...weightForm, peso: e.target.value })} />
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 uppercase text-muted-foreground">Data</th>
                  <th className="text-right p-3 uppercase text-muted-foreground">Peso</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {weightEntries.map(entry => (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">{entry.data}</td>
                    <td className="p-3 text-right font-medium">{entry.peso} kg</td>
                    <td className="p-3 text-right">
                      <button onClick={() => deleteWeightMutation.mutate(entry.id)} className="text-muted-foreground hover:text-destructive transition-colors">Excluir</button>
                    </td>
                  </tr>
                ))}
                {weightEntries.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">Nenhum peso diário registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold">Refeições</h3>
              <p className="text-sm text-muted-foreground">Registre suas refeições e calcule calorias automaticamente quando possível.</p>
            </div>
            <Button onClick={estimateCalories} className="bg-secondary hover:bg-secondary/90" disabled={mealEstimating}>{mealEstimating ? 'Calculando...' : 'Calcular'}</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input type="date" value={mealForm.data} onChange={e => setMealForm({ ...mealForm, data: e.target.value })} />
            <Input type="time" value={mealForm.horario} onChange={e => setMealForm({ ...mealForm, horario: e.target.value })} />
            <Input placeholder="Refeição" value={mealForm.nome} onChange={e => setMealForm({ ...mealForm, nome: e.target.value })} />
            <Input placeholder="Quantidade" value={mealForm.quantidade} onChange={e => setMealForm({ ...mealForm, quantidade: e.target.value })} />
            <Textarea className="sm:col-span-2" placeholder="Descrição" value={mealForm.descricao} onChange={e => setMealForm({ ...mealForm, descricao: e.target.value })} />
            <Input placeholder="Calorias" value={mealForm.calorias} onChange={e => setMealForm({ ...mealForm, calorias: e.target.value })} />
          </div>
          <Button onClick={handleAddMeal} className="w-full bg-primary hover:bg-primary/90 mt-4"><Plus className="w-4 h-4 mr-2" /> Adicionar Refeição</Button>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 uppercase text-muted-foreground">Data</th>
                  <th className="text-left p-3 uppercase text-muted-foreground">Horário</th>
                  <th className="text-left p-3 uppercase text-muted-foreground">Refeição</th>
                  <th className="text-left p-3 uppercase text-muted-foreground">Quantidade</th>
                  <th className="text-right p-3 uppercase text-muted-foreground">Calorias</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {mealEntries.map(entry => (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">{entry.data}</td>
                    <td className="p-3">{entry.horario || '—'}</td>
                    <td className="p-3">{entry.nome}</td>
                    <td className="p-3">{entry.quantidade || '—'}</td>
                    <td className="p-3 text-right font-medium">{entry.calorias ? `${entry.calorias} kcal` : '—'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => deleteMealMutation.mutate(entry.id)} className="text-muted-foreground hover:text-destructive transition-colors">Excluir</button>
                    </td>
                  </tr>
                ))}
                {mealEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma refeição registrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Semana</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Peso (kg)</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Treinos</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Kcal Média</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Plano de Dieta</th>
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
                  <td className="p-4 text-left text-muted-foreground text-sm max-w-[200px] truncate">{r.plano_dieta || '—'}</td>
                  <td className="p-4 text-muted-foreground text-sm max-w-[200px] truncate">{r.observacoes || '—'}</td>
                  <td className="p-4 flex gap-1">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-muted"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                    <button onClick={() => deleteMutation.mutate(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                  </td>
                </tr>
              ))}
              {registros.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum registro.</td></tr>}
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
            <Textarea placeholder="Plano de Dieta" value={form.plano_dieta} onChange={e => setForm({...form, plano_dieta: e.target.value})} />
            <Textarea placeholder="Observações" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} />
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90"><Check className="w-4 h-4 mr-2" /> Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

