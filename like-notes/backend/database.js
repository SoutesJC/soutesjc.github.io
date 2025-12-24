import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Abre o banco
export const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database
});

// Cria tabela
await db.exec(`
  CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT NOT NULL,
    data TEXT NOT NULL,
    hora TEXT NOT NULL,
    tipo TEXT,
    transcricao TEXT,
    nota TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 🔐 Impede duplicatas lógicas
await db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_sessao_unica
  ON sessoes (cliente, data, hora)
`);
