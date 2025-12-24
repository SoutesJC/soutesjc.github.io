import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";
import { db } from "./database.js";
import multer from "multer";
import fs from "fs";

dotenv.config();

/* ===========================
   APP
=========================== */
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* ===========================
   OPENAI
=========================== */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ===========================
   UPLOAD
=========================== */
const upload = multer({
  dest: "uploads/"
});

/* ===========================
   GERAR NOTA (TEXTO)
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

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao gerar nota" });
  }
});

/* ===========================
   GERAR NOTA (ÁUDIO)
=========================== */
app.post(
  "/api/gerar-nota-audio",
  upload.single("audio"),
  async (req, res) => {
    let audioPath;

    try {
      if (!req.file) {
        return res.status(400).json({ erro: "Áudio não enviado" });
      }

      const { cliente, data, hora, tipo } = req.body;
      audioPath = req.file.path;

      /* ===== TRANSCRIÇÃO ===== */
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "gpt-4o-mini-transcribe",
        language: "pt"
      });

      console.log("TRANSCRIÇÃO:", transcription);

      const texto = transcription.text;

      if (!texto) {
        throw new Error("Transcrição retornou vazia");
      }

      /* ===== GERAÇÃO DA NOTA ===== */
      const prompt = `
Gere uma nota profissional clara e objetiva baseada nesta sessão:

Cliente: ${cliente}
Data: ${data}
Hora: ${hora}
Tipo: ${tipo}

Transcrição:
${texto}
`;

      const resposta = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      });

      res.json({
        transcricao: texto,
        nota: resposta.choices[0].message.content
      });

    } catch (err) {
      console.error("ERRO ÁUDIO:", err);
      res.status(500).json({ erro: "Erro ao processar áudio" });

    } finally {
      /* ===== LIMPEZA DO ARQUIVO ===== */
      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }
);

/* ===========================
   CRUD DE SESSÕES
=========================== */

// CREATE
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

// DELETE
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
