import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Settings } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

export default function EditConfigDialog({ config }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    receita_mensal: config?.receita_mensal || 6000,
    custos_operacionais: config?.custos_operacionais || 2020,
    contas_fixas: config?.contas_fixas || 1540,
    alimentacao: config?.alimentacao || 1000,
  });

  const queryClient = useQueryClient();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await apiClient.entities.ConfigFinanceira.update(config.id, values);
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      setOpen(false);
      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Editar Valores
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Configurações Financeiras</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="receita_mensal">Receita Mensal</Label>
            <Input
              id="receita_mensal"
              name="receita_mensal"
              type="number"
              step="0.01"
              value={values.receita_mensal}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="custos_operacionais">Custos Operacionais</Label>
            <Input
              id="custos_operacionais"
              name="custos_operacionais"
              type="number"
              step="0.01"
              value={values.custos_operacionais}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contas_fixas">Contas Fixas</Label>
            <Input
              id="contas_fixas"
              name="contas_fixas"
              type="number"
              step="0.01"
              value={values.contas_fixas}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="alimentacao">Alimentação</Label>
            <Input
              id="alimentacao"
              name="alimentacao"
              type="number"
              step="0.01"
              value={values.alimentacao}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
