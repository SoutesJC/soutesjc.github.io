import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Abre o banco
export const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database
});

// ===============================
// TABELA DE USUÁRIOS (PRIMEIRO)
// ===============================
await db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ===============================
// TABELA DE SESSÕES
// ===============================
await db.exec(`
  CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    cliente TEXT NOT NULL,
    data TEXT NOT NULL,
    hora TEXT NOT NULL,
    tipo TEXT,
    transcricao TEXT,
    nota TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  );
`);

// ===============================
// ÍNDICES
// ===============================

// 🔐 Impede duplicatas lógicas por usuário
await db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_sessao_unica
  ON sessoes (usuario_id, cliente, data, hora);
`);

// ⚡ Performance
await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sessoes_data
  ON sessoes (data);
`);

await db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sessoes_cliente
  ON sessoes (cliente);
`);
