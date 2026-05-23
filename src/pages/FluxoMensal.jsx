import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';

const formatCurrency = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function FluxoMensal() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const maxMonth = `${now.getFullYear() + 5}-${String(12).padStart(2, '0')}`;
  const [newEntry, setNewEntry] = useState({ dia: '', receita: '', gasto: '', categoria: 'Alimentação' });
  const categorias = ['Alimentação', 'Reserva', 'Investimento', 'Presente', 'Compra Casa', 'Mercado', 'Compra Pessoal', 'Gasolina', 'Trabalho Moto', 'Trabalho Tattoo'];

  const queryClient = useQueryClient();
  
  const parseInputNumber = (value) => {
    if (value === undefined || value === null) return 0;
    const s = String(value).trim();
    if (s === '') return 0;
    // Remove currency symbol and spaces, convert BR-format comma to dot
    const cleaned = s.replace(/\s/g, '').replace(/R\$/gi, '').replace(/\./g, '').replace(/,/g, '.');
    const num = Number(cleaned);
    return Number.isNaN(num) ? 0 : num;
  };
  const { data: fluxo, isLoading } = useQuery({
    queryKey: ['fluxo', selectedMonth],
    queryFn: () => apiClient.entities.FluxoDiario.filter({ mes: selectedMonth }, 'dia'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.entities.FluxoDiario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fluxo', selectedMonth] });
      setNewEntry({ dia: '', receita: '', gasto: '', categoria: 'Alimentação' });
      toast.success('Registro adicionado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.FluxoDiario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fluxo', selectedMonth] });
      toast.success('Registro removido!');
    },
  });

  const formatDateLabel = (value) => {
    // Se for string no formato YYYY-MM-DD, fazer split para evitar problema de timezone
    if (typeof value === 'string' && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
    }
    // Fallback para formato de data
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getMonthFromDate = (value) => {
    // Se for string no formato YYYY-MM-DD, fazer split para evitar problema de timezone
    if (typeof value === 'string' && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const [year, month] = parts;
        return `${year}-${String(month).padStart(2, '0')}`;
      }
    }
    // Fallback para cálculo de date
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return selectedMonth;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const handleAdd = () => {
    if (!newEntry.dia) return;
    createMutation.mutate({
      dia: formatDateLabel(newEntry.dia),
      data: newEntry.dia,
      mes: getMonthFromDate(newEntry.dia),
      receita: parseInputNumber(newEntry.receita),
      gasto: parseInputNumber(newEntry.gasto),
      categoria: newEntry.categoria,
    });
  };

  const totalReceita = fluxo.reduce((s, f) => s + (f.receita || 0), 0);
  const totalGasolina = fluxo.reduce((s, f) => s + (f.categoria === 'Gasolina' ? Math.abs(f.gasto || 0) : 0), 0);
  const totalGasto = fluxo.reduce((s, f) => s + Math.abs(f.gasto || 0), 0);
  const lucroTotal = totalReceita - totalGasto;

  const getGroupingDate = (key) => {
    const date = new Date(key);
    if (!Number.isNaN(date.getTime())) return date;
    const parts = String(key).split('/').map((part) => Number(part));
    if (parts.length >= 2) {
      return new Date(now.getFullYear(), (parts[1] || now.getMonth() + 1) - 1, parts[0] || 1);
    }
    return now;
  };

  const groupedFluxo = fluxo.reduce((groups, f) => {
    const groupKey = f.data || f.dia;
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(f);
    return groups;
  }, {});

  const groupedFluxoEntries = Object.entries(groupedFluxo).sort((a, b) => getGroupingDate(a[0]) - getGroupingDate(b[0]));

  let acumulado = 0;
  const chartData = fluxo.map(f => {
    const gasto = (f.gasto || 0);
    const gastoAbs = Math.abs(gasto);
    const lucro = (f.receita || 0) - gastoAbs;
    acumulado += lucro;
    return { dia: `Dia ${f.dia}`, receita: f.receita || 0, gasto, gastoAbs, acumulado };
  });

  return (
    <div>
      <PageHeader title="Fluxo Mensal" subtitle={`Controle diário — ${selectedMonth}`} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Selecionar mês</p>
          <Input type="month" min="2026-01" max={maxMonth} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full sm:w-auto" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Receita', value: totalReceita, cls: 'text-primary' },
          { label: 'Gasolina', value: totalGasolina, cls: 'text-amber-600' },
          { label: 'Gasto', value: totalGasto, cls: 'text-blue-600' },
          { label: 'Lucro', value: lucroTotal, cls: lucroTotal >= 0 ? 'text-primary' : 'text-destructive' },
        ].map(item => (
          <div key={item.label} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
            <p className={`text-xl font-bold mt-1 ${item.cls}`}>{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-8"
        >
          <h3 className="font-semibold mb-4">Receita x Gastos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="receita" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastoAbs" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.gastoAbs > 0 ? '#ef4444' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Add entry */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Novo Registro</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Input type="date" placeholder="Data" value={newEntry.dia} onChange={e => setNewEntry({ ...newEntry, dia: e.target.value })} />
          <Input type="number" placeholder="Receita" value={newEntry.receita} onChange={e => setNewEntry({ ...newEntry, receita: e.target.value })} />
          <Input type="text" placeholder="Gasto (ex: -30 ou R$-30,00)" value={newEntry.gasto} onChange={e => setNewEntry({ ...newEntry, gasto: e.target.value })} />
          <Combobox 
            options={categorias}
            value={newEntry.categoria}
            onValueChange={(value) => setNewEntry({ ...newEntry, categoria: value })}
            placeholder="Categoria"
          />
          <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Dia</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Receita</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Gasolina</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Outros</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Lucro</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {groupedFluxoEntries.map(([groupKey, entries]) => {
                const groupLabel = entries[0].data ? formatDateLabel(entries[0].data) : groupKey;
                const groupTotal = entries.reduce((sum, f) => sum + Math.abs(f.gasto || 0), 0);
                return (
                  <React.Fragment key={groupKey}>
                    <tr className="bg-muted/30">
                      <td colSpan={7} className="p-3 font-semibold text-sm text-slate-700">{groupLabel} — Total gastos: {formatCurrency(groupTotal)}</td>
                    </tr>
                    {entries.map(f => {
                      const gastoVal = (f.gasto || 0);
                      const gasolinaVal = f.categoria === 'Gasolina' ? Math.abs(gastoVal) : 0;
                      const lucro = (f.receita || 0) - Math.abs(gastoVal);
                      return (
                        <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{f.dia}</td>
                          <td className="p-4 font-medium">{f.categoria || 'Outros'}</td>
                          <td className="p-4 text-right text-primary font-medium">{formatCurrency(f.receita)}</td>
                          <td className="p-4 text-right text-amber-600">{formatCurrency(gasolinaVal)}</td>
                          <td className="p-4 text-right text-blue-600">{formatCurrency(Math.abs(gastoVal))}</td>
                          <td className={`p-4 text-right font-semibold ${lucro >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(lucro)}</td>
                          <td className="p-4">
                            <button onClick={() => deleteMutation.mutate(f.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {fluxo.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum registro este mês. Adicione seu primeiro dia acima.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

