import { requireSupabase } from '@/lib/supabase';

const STORAGE_PREFIX = 'app_financeiro:';
const TABLE_ALIASES = {
  ConfigFinanceira: ['config_financeira', 'configs_financeiras', 'user_settings'],
  Divida: ['dividas', 'debts', 'divida'],
  FluxoDiario: ['fluxo_diario', 'transactions', 'fluxo_mensal'],
  Investimento: ['investimentos', 'investments', 'investimento'],
  Meta: ['metas', 'goals', 'meta'],
  MiniIndice: ['mini_indice', 'mini_indice_trades', 'mini_indice_operacoes'],
  AcademiaDieta: ['academia_dieta', 'diet_plans', 'academia_dietas'],
};

const tableCache = new Map();

const normalizeAlias = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}user`) || 'null');
  } catch {
    return null;
  }
};

const getUserId = async () => {
  try {
const supabase = requireSupabase();
  const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    }
  } catch {
    // fallback para armazenamento local
  }

  const localUser = getLocalUser();

  if (localUser?.id) {
    return localUser.id;
  }

  throw new Error('Usuário não autenticado');
};

const resolveTableName = async (entityName) => {
  if (tableCache.has(entityName)) {
    return tableCache.get(entityName);
  }

  const candidates = Array.from(
    new Set([
      entityName,
      normalizeAlias(entityName),
      ...(TABLE_ALIASES[entityName] || []),
    ])
  );

  for (const candidate of candidates) {
    try {
      const supabase = requireSupabase();
      const { error } = await supabase
        .from(candidate)
        .select('id', { head: true, count: 'exact' });

      if (!error) {
        tableCache.set(entityName, candidate);
        return candidate;
      }
    } catch {
      // tenta o próximo nome
    }
  }

  tableCache.set(entityName, entityName);
  return entityName;
};

const getStorageKey = (entityName, userId) => `${STORAGE_PREFIX}${entityName}_${userId || 'guest'}`;

const sanitizePayloadForSchemaError = (entityName, payload, error) => {
  const message = String(error?.message || '');
  const sanitized = { ...payload };

  const missingColumns = [...message.matchAll(/'([^']+)' column/i)].map((match) => match[1]);

  missingColumns.forEach((column) => {
    delete sanitized[column];
  });

  if (entityName === 'debts' && /pago/i.test(message)) {
    delete sanitized.pago;
  }

  if (entityName === 'mini_indice_trades' && /contratos/i.test(message)) {
    delete sanitized.contratos;
  }

  return sanitized;
};

const executeWithSchemaFallback = async ({ entityName, operation, buildRequest }) => {
  const result = await operation(buildRequest(payload => payload));

  if (!result.error) {
    return result;
  }

  const sanitizedPayload = sanitizePayloadForSchemaError(entityName, buildRequest.payload ?? {}, result.error);

  if (JSON.stringify(sanitizedPayload) !== JSON.stringify(buildRequest.payload ?? {})) {
    const retryResult = await operation(buildRequest(() => sanitizedPayload));
    if (!retryResult.error) {
      return retryResult;
    }
  }

  return result;
};

const readLocalItems = (entityName, userId) => {
  try {
    const raw = localStorage.getItem(getStorageKey(entityName, userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalItems = (entityName, userId, items) => {
  localStorage.setItem(getStorageKey(entityName, userId), JSON.stringify(items));
};

const localFallback = (entityName) => ({
  list: async () => readLocalItems(entityName, await getUserId()),
  filter: async (filters = {}, sortKey) => {
    const items = readLocalItems(entityName, await getUserId());
    const matched = items.filter((item) => Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return true;
      }
      return String(item[key] ?? '').toLowerCase().includes(String(value).toLowerCase());
    }));

    if (!sortKey) {
      return matched;
    }

    const direction = sortKey.startsWith('-') ? -1 : 1;
    const key = sortKey.replace(/^-/, '');

    return [...matched].sort((a, b) => {
      const aValue = a[key] ?? '';
      const bValue = b[key] ?? '';
      if (aValue === bValue) return 0;
      return (aValue > bValue ? 1 : -1) * direction;
    });
  },
  create: async (payload) => {
    const userId = await getUserId();
    const items = readLocalItems(entityName, userId);
    const item = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...payload, user_id: userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    writeLocalItems(entityName, userId, [...items, item]);
    return item;
  },
  update: async (id, payload) => {
    const userId = await getUserId();
    const items = readLocalItems(entityName, userId);
    const updated = items.map((item) => (item.id === id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item));
    writeLocalItems(entityName, userId, updated);
    return updated.find((item) => item.id === id) || null;
  },
  delete: async (id) => {
    const userId = await getUserId();
    const items = readLocalItems(entityName, userId).filter((item) => item.id !== id);
    writeLocalItems(entityName, userId, items);
    return true;
  },
});

const createEntityService = (entityName) => {
  const fallback = localFallback(entityName);

  return {
    list: async () => {
      try {
        const supabase = requireSupabase();
        const userId = await getUserId();
        const tableName = await resolveTableName(entityName);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        return data || [];
      } catch (error) {
        console.warn(`Falha ao listar ${entityName}, usando fallback local.`, error);
        return fallback.list();
      }
    },

    filter: async (filters = {}, sortKey) => {
      try {
        const supabase = requireSupabase();
        const userId = await getUserId();
        const tableName = await resolveTableName(entityName);
        let query = supabase
          .from(tableName)
          .select('*')
          .eq('user_id', userId);

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.ilike(key, `%${String(value)}%`);
          }
        });

        if (sortKey) {
          const direction = sortKey.startsWith('-') ? false : true;
          const key = sortKey.replace(/^-/, '');
          query = query.order(key, { ascending: direction });
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return data || [];
      } catch (error) {
        console.warn(`Falha ao filtrar ${entityName}, usando fallback local.`, error);
        return fallback.filter(filters, sortKey);
      }
    },

    create: async (payload) => {
      try {
        const supabase = requireSupabase();
        const userId = await getUserId();
        const tableName = await resolveTableName(entityName);

        const buildRequest = (resolver) => ({
          payload: resolver(payload),
          execute: () => supabase
            .from(tableName)
            .insert([
              {
                ...resolver(payload),
                user_id: userId,
              },
            ])
            .select()
            .single(),
        });

        const request = buildRequest((value) => value);
        const { data, error } = await request.execute();

        if (error) {
          const sanitizedPayload = sanitizePayloadForSchemaError(entityName, request.payload, error);
          if (JSON.stringify(sanitizedPayload) !== JSON.stringify(request.payload)) {
            const retry = buildRequest(() => sanitizedPayload);
            const retryResult = await retry.execute();
            if (!retryResult.error) {
              return retryResult.data;
            }
          }
          throw error;
        }

        return data;
      } catch (error) {
        console.warn(`Falha ao criar ${entityName}, usando fallback local.`, error);
        return fallback.create(payload);
      }
    },

    update: async (id, payload) => {
      try {
        const supabase = requireSupabase();
        const userId = await getUserId();
        const tableName = await resolveTableName(entityName);

        const buildRequest = (resolver) => ({
          payload: resolver(payload),
          execute: () => supabase
            .from(tableName)
            .update(resolver(payload))
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single(),
        });

        const request = buildRequest((value) => value);
        const { data, error } = await request.execute();

        if (error) {
          const sanitizedPayload = sanitizePayloadForSchemaError(entityName, request.payload, error);
          if (JSON.stringify(sanitizedPayload) !== JSON.stringify(request.payload)) {
            const retry = buildRequest(() => sanitizedPayload);
            const retryResult = await retry.execute();
            if (!retryResult.error) {
              return retryResult.data;
            }
          }
          throw error;
        }

        return data;
      } catch (error) {
        console.warn(`Falha ao atualizar ${entityName}, usando fallback local.`, error);
        return fallback.update(id, payload);
      }
    },

    delete: async (id) => {
      try {
        const supabase = requireSupabase();
        const userId = await getUserId();
        const tableName = await resolveTableName(entityName);
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        return true;
      } catch (error) {
        console.warn(`Falha ao excluir ${entityName}, usando fallback local.`, error);
        return fallback.delete(id);
      }
    },
  };
};

export const apiClient = {
  entities: {
    ConfigFinanceira: createEntityService('user_settings'),
    Divida: createEntityService('debts'),
    FluxoDiario: createEntityService('transactions'),
    Investimento: createEntityService('investments'),
    Meta: createEntityService('goals'),
    MiniIndice: createEntityService('mini_indice_trades'),
    AcademiaDieta: createEntityService('diet_plans'),

    // Criar tabelas depois
    // DietaRefeicoes: createEntityService('dieta_refeicoes'),
    // PesoDiario: createEntityService('peso_diario'),
  },
};