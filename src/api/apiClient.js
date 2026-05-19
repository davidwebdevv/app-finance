const STORAGE_PREFIX = 'app_financeiro_';
const API_BASE_URL = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : '';
const useBackend = Boolean(API_BASE_URL && API_BASE_URL.length > 0);

const DEFAULT_DATA = {
  ConfigFinanceira: [
    {
      id: 'config',
      receita_mensal: 6000,
      custos_operacionais: 2020,
      contas_fixas: 1540,
      alimentacao: 1000,
      livre: 0,
      dividas: 0,
      reserva: 0,
      investimentos: 0,
      lazer: 0,
    },
  ],
  Divida: [],
  FluxoDiario: [],
  Investimento: [],
  Meta: [],
  MiniIndice: [],
  AcademiaDieta: [],
};

const getStorageKey = (entityName) => `${STORAGE_PREFIX}${entityName}`;

const readEntityData = (entityName) => {
  if (typeof window === 'undefined') {
    return DEFAULT_DATA[entityName] || [];
  }
  try {
    const stored = window.localStorage.getItem(getStorageKey(entityName));
    if (!stored) {
      window.localStorage.setItem(getStorageKey(entityName), JSON.stringify(DEFAULT_DATA[entityName] || []));
      return DEFAULT_DATA[entityName] || [];
    }
    return JSON.parse(stored) || [];
  } catch (error) {
    return DEFAULT_DATA[entityName] || [];
  }
};

const writeEntityData = (entityName, data) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(getStorageKey(entityName), JSON.stringify(data));
};

const stableSort = (items, sortKey) => {
  if (!sortKey) return items;
  const direction = sortKey.startsWith('-') ? -1 : 1;
  const key = sortKey.replace(/^-/, '');
  return [...items].sort((a, b) => {
    const va = a?.[key] ?? '';
    const vb = b?.[key] ?? '';
    if (va === vb) return 0;
    if (va > vb) return direction;
    return -direction;
  });
};

const filterItems = (items, filters = {}) => {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return true;
      }
      if (typeof item[key] === 'string') {
        return item[key].toLowerCase().includes(String(value).toLowerCase());
      }
      return item[key] === value;
    });
  });
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildUrl = (path, params = {}) => {
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = new URL(`${base}/${path.replace(/^\//, '')}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const apiFetch = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }
  return response.json();
};

const createEntityService = (entityName) => ({
  list: async (sortKey) => {
    if (useBackend) {
      return apiFetch(buildUrl(`/entities/${entityName}`, { sort: sortKey }));
    }
    const items = readEntityData(entityName);
    return stableSort(items, sortKey);
  },
  filter: async (filters = {}, sortKey) => {
    if (useBackend) {
      return apiFetch(buildUrl(`/entities/${entityName}`, { ...filters, sort: sortKey }));
    }
    const items = filterItems(readEntityData(entityName), filters);
    return stableSort(items, sortKey);
  },
  create: async (data) => {
    if (useBackend) {
      return apiFetch(buildUrl(`/entities/${entityName}`), {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
    const existing = readEntityData(entityName);
    const item = { id: createId(), ...data };
    const next = [...existing, item];
    writeEntityData(entityName, next);
    return item;
  },
  update: async (id, data) => {
    if (useBackend) {
      return apiFetch(buildUrl(`/entities/${entityName}/${id}`), {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    const existing = readEntityData(entityName);
    const next = existing.map((item) => item.id === id ? { ...item, ...data } : item);
    writeEntityData(entityName, next);
    return next.find((item) => item.id === id) || null;
  },
  delete: async (id) => {
    if (useBackend) {
      return apiFetch(buildUrl(`/entities/${entityName}/${id}`), {
        method: 'DELETE',
      });
    }
    const existing = readEntityData(entityName);
    const next = existing.filter((item) => item.id !== id);
    writeEntityData(entityName, next);
    return id;
  },
});

const auth = {
  me: async () => {
    if (useBackend) {
      return apiFetch(buildUrl('/auth/me'));
    }
    if (typeof window === 'undefined') {
      return { id: 'user', name: 'Usuário', role: 'user' };
    }
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}user`);
    if (stored) {
      return JSON.parse(stored);
    }
    const defaultUser = { id: 'user', name: 'Usuário', role: 'admin' };
    window.localStorage.setItem(`${STORAGE_PREFIX}user`, JSON.stringify(defaultUser));
    return defaultUser;
  },
  logout: async (redirectUrl) => {
    if (useBackend) {
      await fetch(buildUrl('/auth/logout'), { method: 'POST' }).catch(() => null);
    }
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(`${STORAGE_PREFIX}user`);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
  redirectToLogin: (redirectUrl) => {
    if (typeof window === 'undefined') return;
    window.location.href = redirectUrl || '/';
  },
};

export const apiClient = {
  auth,
  entities: {
    ConfigFinanceira: createEntityService('ConfigFinanceira'),
    Divida: createEntityService('Divida'),
    FluxoDiario: createEntityService('FluxoDiario'),
    Investimento: createEntityService('Investimento'),
    Meta: createEntityService('Meta'),
    MiniIndice: createEntityService('MiniIndice'),
    AcademiaDieta: createEntityService('AcademiaDieta'),
  },
};
