import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai/index.js";
import { db } from "./database.js";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ===========================
   OpenAI
=========================== */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===========================
   GERAR NOTA (IA)
=========================== */
app.post("/api/gerar-nota", async (req, res) => {
  try {
    const { cliente, data, hora, tipo, transcricao } = req.body;

    if (!transcricao) {
      return res.status(400).json({ erro: "Transcrição vazia" });
    }

    const prompt = `
Gere uma nota profissional clara e objetiva baseada nesta sessão:

Cliente: ${cliente}
Data: ${data}
Hora: ${hora}
Tipo: ${tipo}

Transcrição:
${transcricao}
`;

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ nota: resposta.choices[0].message.content });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao gerar nota" });
  }
});

/* ===========================
   CRUD DE SESSÕES
=========================== */

// CREATE (com proteção contra duplicação)
app.post("/api/sessoes", async (req, res) => {
  const { cliente, data, hora, tipo, transcricao, nota } = req.body;

  try {
    const result = await db.run(
      `INSERT INTO sessoes (cliente, data, hora, tipo, transcricao, nota)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cliente, data, hora, tipo, transcricao, nota]
    );

    res.json({ id: result.lastID });

  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT") {
      return res.status(409).json({ erro: "Sessão já existe" });
    }
    console.error(err);
    res.status(500).json({ erro: "Erro ao salvar sessão" });
  }
});

// READ ALL
app.get("/api/sessoes", async (req, res) => {
  const sessoes = await db.all(
    `SELECT id, cliente, data, hora, tipo
     FROM sessoes
     ORDER BY criado_em DESC`
  );
  res.json(sessoes);
});

// READ ONE
app.get("/api/sessoes/:id", async (req, res) => {
  const sessao = await db.get(
    `SELECT * FROM sessoes WHERE id = ?`,
    [req.params.id]
  );

  if (!sessao) {
    return res.status(404).json({ erro: "Sessão não encontrada" });
  }

  res.json(sessao);
});

// UPDATE
app.put("/api/sessoes/:id", async (req, res) => {
  const { cliente, data, hora, tipo, transcricao, nota } = req.body;

  await db.run(
    `UPDATE sessoes
     SET cliente = ?, data = ?, hora = ?, tipo = ?, transcricao = ?, nota = ?
     WHERE id = ?`,
    [cliente, data, hora, tipo, transcricao, nota, req.params.id]
  );

  res.json({ ok: true });
});

// DELETE (seguro, por ID)
app.delete("/api/sessoes/:id", async (req, res) => {
  await db.run(`DELETE FROM sessoes WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
});

/* ===========================
   START
=========================== */
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
