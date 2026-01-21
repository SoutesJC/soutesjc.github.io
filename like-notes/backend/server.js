import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import PDFDocument from "pdfkit";
import OpenAI from "openai";
import { db } from "./database.js";
import multer from "multer";
import fs from "fs";
import path from "path";

dotenv.config();

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}


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


const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // mantém .mp3
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

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

      console.log("Arquivo:", audioPath);
      console.log("Existe?", fs.existsSync(audioPath));
      console.log("Tamanho:", fs.statSync(audioPath).size);

      /* ===== TRANSCRIÇÃO ===== */
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
        language: "pt"
      });

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
      res.status(500).json({
        erro: "Erro ao processar áudio",
        detalhe: err.message
      });

    } finally {
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

// SEARCH (nome OU data)
app.get("/api/sessoes/busca", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ erro: "Parâmetro de busca vazio" });
  }

  try {
    let resultados;

    // YYYY-MM-DD (data exata)
    if (/^\d{4}-\d{2}-\d{2}$/.test(q)) {
      resultados = await db.all(
        `SELECT id, cliente, data, hora, tipo
         FROM sessoes
         WHERE data = ?
         ORDER BY criado_em DESC`,
        [q]
      );

    // YYYY (ano)
    } else if (/^\d{4}$/.test(q)) {
      const inicio = `${q}-01-01`;
      const fim = `${q}-12-31`;

      resultados = await db.all(
        `SELECT id, cliente, data, hora, tipo
         FROM sessoes
         WHERE data BETWEEN ? AND ?
         ORDER BY criado_em DESC`,
        [inicio, fim]
      );

    // MM (mês)
    } else if (/^\d{2}$/.test(q)) {
      resultados = await db.all(
        `SELECT id, cliente, data, hora, tipo
         FROM sessoes
         WHERE substr(data, 6, 2) = ?
         ORDER BY criado_em DESC`,
        [q]
      );

    // Nome (prefixo indexável)
    } else {
      const inicio = q;
      const fim = q + '\uffff';

      resultados = await db.all(
        `SELECT id, cliente, data, hora, tipo
         FROM sessoes
         WHERE cliente >= ? AND cliente < ?
         ORDER BY criado_em DESC`,
        [inicio, fim]
      );
    }

    res.json(resultados);

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro na busca" });
  }
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
   GERAR PDF
=========================== */

app.get("/api/sessoes/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Busca a sessão
    const sessao = await db.get(
      `SELECT * FROM sessoes WHERE id = ?`,
      [id]
    );

    if (!sessao) {
      return res.status(404).json({ erro: "Sessão não encontrada" });
    }

    // 2️⃣ Cria o PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 50
    });

    // 3️⃣ Headers para download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=nota-sessao-${id}.pdf`
    );

    // Stream direto para resposta
    doc.pipe(res);

    // 4️⃣ Conteúdo do PDF
    doc
      .fontSize(18)
      .text("NOTA DE SESSÃO", { align: "center" })
      .moveDown(2);

    doc
      .fontSize(12)
      .text(`Cliente: ${sessao.cliente}`)
      .text(`Data: ${sessao.data}`)
      .text(`Hora: ${sessao.hora}`)
      .text(`Tipo: ${sessao.tipo || "-"}`)
      .moveDown();

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown();

    doc
      .fontSize(12)
      .text(sessao.nota || "Nenhuma nota registrada.", {
        align: "left"
      });

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(
        `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
        { align: "right" }
      );

    // 5️⃣ Finaliza PDF
    doc.end();

  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).json({ erro: "Erro ao gerar PDF" });
  }
});

/* ===========================
   START
=========================== */
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
