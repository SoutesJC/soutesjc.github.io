import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

// Abre o banco (cria se não existir)
export const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database
});

// Cria tabela automaticamente
await db.exec(`
  CREATE TABLE IF NOT EXISTS sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT,
    data TEXT,
    hora TEXT,
    tipo TEXT,
    transcricao TEXT,
    nota TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
