import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const DB_PATH = join(__dirname, 'database.sqlite');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

const sendJson = (res, body, status = 200) => res.status(status).json(body);
const sendError = (res, status, message) => res.status(status).json({ error: message });

const createToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return sendError(res, 401, 'Missing authorization token');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token');
  }
};

app.post('/auth/register', (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password || !name) {
    return sendError(res, 400, 'Email, senha e nome são obrigatórios');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return sendError(res, 409, 'Este email já está em uso');
  }

  const id = createId();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)' 
  ).run(id, normalizedEmail, passwordHash, String(name).trim(), now());

  const token = createToken(id);
  return sendJson(res, {
    token,
    user: {
      id,
      email: normalizedEmail,
      name: String(name).trim(),
    },
  }, 201);
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return sendError(res, 400, 'Email e senha são obrigatórios');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db
    .prepare('SELECT id, email, password_hash, name FROM users WHERE email = ?')
    .get(normalizedEmail);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return sendError(res, 401, 'Email ou senha inválidos');
  }

  const token = createToken(user.id);
  return sendJson(res, {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

app.post('/auth/logout', (_req, res) => sendJson(res, { success: true }));

app.get('/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return sendError(res, 401, 'Usuário não encontrado');
  }
  return sendJson(res, user);
});

const stableSort = (items, sortKey) => {
  if (!sortKey) return items;
  const direction = sortKey.startsWith('-') ? -1 : 1;
  const key = sortKey.replace(/^-/, '');

  return [...items].sort((a, b) => {
    const va = a?.[key] ?? '';
    const vb = b?.[key] ?? '';

    if (va === vb) return 0;
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * direction;
    }
    return String(va).localeCompare(String(vb)) * direction;
  });
};

const matchesFilters = (item, filters) => {
  return Object.entries(filters).every(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    const raw = item[key];
    if (raw === undefined || raw === null) {
      return false;
    }
    return String(raw).toLowerCase().includes(String(value).toLowerCase());
  });
};

app.get('/entities/:entity', authMiddleware, (req, res) => {
  const entityName = req.params.entity;
  const sortKey = String(req.query.sort || '').trim();
  const filters = { ...req.query };
  delete filters.sort;

  const rows = db
    .prepare('SELECT id, data FROM entities WHERE user_id = ? AND entity_name = ?')
    .all(req.userId, entityName);

  const items = rows
    .map((row) => ({ id: row.id, ...JSON.parse(row.data) }))
    .filter((item) => matchesFilters(item, filters));

  const sorted = stableSort(items, sortKey);
  return sendJson(res, sorted);
});

app.post('/entities/:entity', authMiddleware, (req, res) => {
  const entityName = req.params.entity;
  const payload = req.body || {};
  const id = payload.id ? String(payload.id) : createId();
  const createdAt = now();
  const updatedAt = createdAt;
  const item = { id, ...payload, createdAt, updatedAt };

  db.prepare(
    'INSERT INTO entities (id, user_id, entity_name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)' 
  ).run(id, req.userId, entityName, JSON.stringify(item), createdAt, updatedAt);

  return sendJson(res, item, 201);
});

app.put('/entities/:entity/:id', authMiddleware, (req, res) => {
  const entityName = req.params.entity;
  const id = req.params.id;
  const payload = req.body || {};

  const existing = db
    .prepare('SELECT data FROM entities WHERE id = ? AND user_id = ? AND entity_name = ?')
    .get(id, req.userId, entityName);

  if (!existing) {
    return sendError(res, 404, 'Registro não encontrado');
  }

  const currentData = JSON.parse(existing.data);
  const updatedAt = now();
  const item = {
    ...currentData,
    ...payload,
    id,
    createdAt: currentData.createdAt || existing.created_at,
    updatedAt,
  };

  db.prepare('UPDATE entities SET data = ?, updated_at = ? WHERE id = ?')
    .run(JSON.stringify(item), updatedAt, id);

  return sendJson(res, item);
});

app.delete('/entities/:entity/:id', authMiddleware, (req, res) => {
  const entityName = req.params.entity;
  const id = req.params.id;

  const result = db
    .prepare('DELETE FROM entities WHERE id = ? AND user_id = ? AND entity_name = ?')
    .run(id, req.userId, entityName);

  if (result.changes === 0) {
    return sendError(res, 404, 'Registro não encontrado');
  }

  return sendJson(res, { id });
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
