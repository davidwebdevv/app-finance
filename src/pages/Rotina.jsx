import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil } from 'lucide-react';

const DEFAULT_ROTINA = {
  'Segunda a Sexta': [
    { hora: '08:30 – 09:30', atividade: 'Café da manhã', emoji: '🍳🥛', detalhe: 'Ovos, aveia, banana, mel, pasta de amendoim e leite', tipo: 'refeicao' },
    { hora: '09:30 – 10:30', atividade: 'Estudo Programação/Faculdade', emoji: '💻', tipo: 'estudo' },
    { hora: '10:30 – 10:50', atividade: 'Lanche da manhã', emoji: '🍎🥪', detalhe: 'Sanduíche integral, fruta, iogurte', tipo: 'refeicao' },
    { hora: '11:00 – 15:00', atividade: 'Trabalho iFood', emoji: '🚴', tipo: 'trabalho' },
    { hora: '15:00 – 15:30', atividade: 'Almoço', emoji: '🍚🥗', detalhe: 'Arroz, frango/carne, feijão, salada, batata doce', tipo: 'refeicao' },
    { hora: '15:30 – 16:30', atividade: 'Academia', emoji: '🏋️', detalhe: 'Treino + preparo/pós-treino depois', tipo: 'academia' },
    { hora: '16:30 – 17:00', atividade: 'Pós-treino', emoji: '🥤🍌', detalhe: 'Shake de whey + fruta + pão integral com pasta de amendoim', tipo: 'refeicao' },
    { hora: '17:00 – 18:00', atividade: 'Estudo Inglês', emoji: '📘', tipo: 'estudo' },
    { hora: '18:00 – 18:20', atividade: 'Pré-treino', emoji: '🍝🍌', detalhe: 'Macarrão integral + frango/carne moída + banana', tipo: 'refeicao' },
    { hora: '18:30 – 23:00', atividade: 'Trabalho iFood', emoji: '🚴', tipo: 'trabalho' },
    { hora: '23:00 – 23:30', atividade: 'Jantar', emoji: '🍲', detalhe: 'Arroz/macarrão integral, peixe/frango, legumes, salada', tipo: 'refeicao' },
    { hora: '23:30 – 00:00', atividade: 'Passeio com o cachorro', emoji: '🐕', tipo: 'lazer' },
    { hora: '00:00 – 00:30', atividade: 'Ceia', emoji: '🥛', detalhe: 'Iogurte natural, aveia e oleaginosas', tipo: 'refeicao' },
    { hora: '00:30 – 08:30', atividade: 'Sono', emoji: '😴', tipo: 'descanso' },
  ],
  'Sábado': [
    { hora: '08:30 – 09:30', atividade: 'Café da manhã', emoji: '🍳', tipo: 'refeicao' },
    { hora: '09:30 – 10:30', atividade: 'Lavar o banheiro', emoji: '🚿', detalhe: 'A cada 15 dias', tipo: 'tarefa' },
    { hora: '10:30 – 11:00', atividade: 'Lanche da manhã', emoji: '🍎', tipo: 'refeicao' },
    { hora: '11:00 – 15:00', atividade: 'Trabalho iFood', emoji: '🚴', tipo: 'trabalho' },
    { hora: '15:00 – 15:30', atividade: 'Almoço', emoji: '🍚', tipo: 'refeicao' },
    { hora: '15:30 – 16:30', atividade: 'Academia', emoji: '🏋️', tipo: 'academia' },
    { hora: '16:30 – 17:30', atividade: 'Limpar o quarto + pós-treino', emoji: '🧹', tipo: 'tarefa' },
    { hora: '17:30 – 18:00', atividade: 'Livre ou passeio com cachorro', emoji: '🐕', tipo: 'lazer' },
    { hora: '18:00 – 18:20', atividade: 'Pré-treino', emoji: '🍝', tipo: 'refeicao' },
    { hora: '18:30 – 23:00', atividade: 'Trabalho iFood', emoji: '🚴', tipo: 'trabalho' },
    { hora: '23:00+', atividade: 'Jantar, passeio cachorro, ceia, sono', emoji: '🌙', tipo: 'descanso' },
  ],
  'Domingo': [
    { hora: '08:30 – 09:30', atividade: 'Café da manhã', emoji: '🍳', tipo: 'refeicao' },
    { hora: '09:30 – 11:00', atividade: 'Hobbies', emoji: '🎨🎮', detalhe: 'Pintura a óleo ou games', tipo: 'lazer' },
    { hora: '11:00 – 15:00', atividade: 'Trabalho iFood', emoji: '🚴', tipo: 'trabalho' },
    { hora: '15:00 – 15:30', atividade: 'Almoço', emoji: '🍚', tipo: 'refeicao' },
    { hora: '15:30 – 16:30', atividade: 'Passeio longo com cachorro ou lazer ao ar livre', emoji: '🐕☀️', tipo: 'lazer' },
    { hora: '16:30 – 17:30', atividade: 'Estudo Mini-índice', emoji: '📈', detalhe: 'Investimentos', tipo: 'estudo' },
    { hora: '17:30 – 18:00', atividade: 'Pré-trabalho', emoji: '🍝', tipo: 'refeicao' },
    { hora: '18:30 – 23:00', atividade: 'Trabalho iFood', emoji: '🚴', tipo: 'trabalho' },
    { hora: '23:00+', atividade: 'Jantar, ceia, games leves ou pintura, sono', emoji: '🌙', tipo: 'descanso' },
  ],
};

const tipoCores = {
  refeicao: 'bg-emerald-100 border-emerald-200 text-emerald-800',
  trabalho: 'bg-blue-100 border-blue-200 text-blue-800',
  estudo: 'bg-purple-100 border-purple-200 text-purple-800',
  academia: 'bg-orange-100 border-orange-200 text-orange-800',
  lazer: 'bg-pink-100 border-pink-200 text-pink-800',
  tarefa: 'bg-amber-100 border-amber-200 text-amber-800',
  descanso: 'bg-slate-100 border-slate-200 text-slate-600',
};

const tipoLabel = {
  refeicao: 'Refeição',
  trabalho: 'Trabalho',
  estudo: 'Estudo',
  academia: 'Academia',
  lazer: 'Lazer',
  tarefa: 'Tarefa',
  descanso: 'Descanso',
};

const TABS = Object.keys(DEFAULT_ROTINA);

const loadRotina = () => {
  try {
    const stored = localStorage.getItem('rotina_data');
    return stored ? JSON.parse(stored) : DEFAULT_ROTINA;
  } catch {
    return DEFAULT_ROTINA;
  }
};

const saveRotina = (rotina) => {
  localStorage.setItem('rotina_data', JSON.stringify(rotina));
};

export default function Rotina() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [rotina, setRotina] = useState(loadRotina());
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValues, setEditingValues] = useState({ atividade: '', tipo: '' });
  const [addingNew, setAddingNew] = useState(false);
  const [newActivity, setNewActivity] = useState({ atividade: '', tipo: 'refeicao', hora: '12:00 – 13:00' });

  useEffect(() => {
    saveRotina(rotina);
  }, [rotina]);

  const handleEditStart = (index, item) => {
    setEditingIndex(index);
    setEditingValues({ atividade: item.atividade, tipo: item.tipo });
  };

  const handleEditSave = () => {
    if (editingValues.atividade.trim()) {
      const newRotina = { ...rotina };
      newRotina[activeTab][editingIndex] = {
        ...newRotina[activeTab][editingIndex],
        atividade: editingValues.atividade,
        tipo: editingValues.tipo,
      };
      setRotina(newRotina);
    }
    setEditingIndex(null);
  };

  const handleAddActivity = () => {
    if (newActivity.atividade.trim()) {
      const newRotina = { ...rotina };
      newRotina[activeTab].push({
        hora: newActivity.hora,
        atividade: newActivity.atividade,
        emoji: '⭐',
        tipo: newActivity.tipo,
      });
      setRotina(newRotina);
      setNewActivity({ atividade: '', tipo: 'refeicao', hora: '12:00 – 13:00' });
      setAddingNew(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === targetIndex) return;

    const newRotina = { ...rotina };
    const items = [...newRotina[activeTab]];
    const [draggedItemContent] = items.splice(draggedItem, 1);
    items.splice(targetIndex, 0, draggedItemContent);
    newRotina[activeTab] = items;
    setRotina(newRotina);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div>
      <PageHeader title="Rotina Diária" subtitle="Sua organização pessoal" />

      {/* Tab selector */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'bg-card text-muted-foreground border border-border hover:bg-muted'
              }`}
            >
              {tab === 'Segunda a Sexta' ? '📅 Seg-Sex' : tab === 'Sábado' ? '📅 Sábado' : '📅 Domingo'}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setAddingNew(true)}
          size="sm"
          className="gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(tipoLabel).map(([key, label]) => (
          <span key={key} className={`text-xs px-3 py-1 rounded-full border font-medium ${tipoCores[key]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {rotina[activeTab].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={`flex gap-4 items-start cursor-move transition-opacity ${draggedItem === i ? 'opacity-50' : ''}`}
          >
            {/* Time column */}
            <div className="w-28 sm:w-36 flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-foreground">{item.hora.split('–')[0].trim()}</p>
              {item.hora.includes('–') && (
                <p className="text-xs text-muted-foreground">{item.hora.split('–')[1]?.trim()}</p>
              )}
            </div>

            {/* Dot and line */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 border-2 ${
                item.tipo === 'trabalho' ? 'bg-blue-500 border-blue-300' :
                item.tipo === 'refeicao' ? 'bg-emerald-500 border-emerald-300' :
                item.tipo === 'academia' ? 'bg-orange-500 border-orange-300' :
                item.tipo === 'estudo' ? 'bg-purple-500 border-purple-300' :
                item.tipo === 'lazer' ? 'bg-pink-500 border-pink-300' :
                item.tipo === 'tarefa' ? 'bg-amber-500 border-amber-300' :
                'bg-slate-400 border-slate-300'
              }`} />
              {i < rotina[activeTab].length - 1 && (
                <div className="w-0.5 h-full min-h-[40px] bg-border" />
              )}
            </div>

            {/* Content */}
            <div
              onClick={() => handleEditStart(i, item)}
              className={`flex-1 rounded-xl p-4 border hover:shadow-md hover:cursor-pointer transition-shadow group relative ${tipoCores[item.tipo]} mb-1`}
            >
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{item.emoji}</span>
                  <h3 className="font-semibold text-sm">{item.atividade}</h3>
                </div>
                <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              {item.detalhe && (
                <p className="text-xs mt-1 opacity-75">{item.detalhe}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Atividade</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="atividade">Nome da Atividade</Label>
              <Input
                id="atividade"
                value={editingValues.atividade}
                onChange={(e) => setEditingValues({ ...editingValues, atividade: e.target.value })}
                placeholder="Ex: Café da manhã"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={editingValues.tipo} onValueChange={(value) => setEditingValues({ ...editingValues, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabel).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingIndex(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Activity Dialog */}
      <Dialog open={addingNew} onOpenChange={setAddingNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Atividade</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-atividade">Nome da Atividade</Label>
              <Input
                id="new-atividade"
                value={newActivity.atividade}
                onChange={(e) => setNewActivity({ ...newActivity, atividade: e.target.value })}
                placeholder="Ex: Café da manhã"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-hora">Horário</Label>
              <Input
                id="new-hora"
                value={newActivity.hora}
                onChange={(e) => setNewActivity({ ...newActivity, hora: e.target.value })}
                placeholder="Ex: 08:30 – 09:30"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-tipo">Tipo</Label>
              <Select value={newActivity.tipo} onValueChange={(value) => setNewActivity({ ...newActivity, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabel).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddingNew(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddActivity}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}