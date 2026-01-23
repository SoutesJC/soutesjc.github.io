import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import PDFDocument from "pdfkit";
import OpenAI from "openai";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

app.use(cors({
  origin: [
    "http://localhost:5500", // dev
    "https://SEU-PROJETO.vercel.app" // produção
  ],
  credentials: true
}));

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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
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
app.post("/api/sessoes", auth, async (req, res) => {
  const { cliente, data, hora, tipo, transcricao, nota } = req.body;
  const usuario_id = req.user.id;

  try {
    const result = await db.run(
      `INSERT INTO sessoes
       (usuario_id, cliente, data, hora, tipo, transcricao, nota)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, cliente, data, hora, tipo, transcricao, nota]
    );

    res.json({ id: result.lastID });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao salvar sessão" });
  }
});


// READ ALL
app.get("/api/sessoes", auth, async (req, res) => {
  const usuario_id = req.user.id;

  const sessoes = await db.all(
    `SELECT id, cliente, data, hora, tipo
     FROM sessoes
     WHERE usuario_id = ?
     ORDER BY criado_em DESC`,
    [usuario_id]
  );

  res.json(sessoes);
});

// SEARCH (nome OU data)
app.get("/api/sessoes/busca", auth, async (req, res) => {
  const { q } = req.query;
  const usuario_id = req.user.id;

  if (!q) {
    return res.status(400).json({ erro: "Parâmetro de busca vazio" });
  }

  try {
    let resultados;

    // Data exata
    if (/^\d{4}-\d{2}-\d{2}$/.test(q)) {
      resultados = await db.all(
        `SELECT id, cliente, data, hora, tipo
         FROM sessoes
         WHERE usuario_id = ? AND data = ?
         ORDER BY criado_em DESC`,
        [usuario_id, q]
      );

    // Ano
    } else if (/^\d{4}$/.test(q)) {
      resultados = await db.all(
        `SELECT id, cliente, data, hora, tipo
         FROM sessoes
         WHERE usuario_id = ?
           AND data BETWEEN ? AND ?
         ORDER BY criado_em DESC`,
        [usuario_id, `${q}-01-01`, `${q}-12-31`]
      );

    // Mês
    } else if (/^\d{2}$/.test(q)) {
      resultados = await db.all(
        `SELECT id, cliente, data, hora, tipo
         FROM sessoes
         WHERE usuario_id = ?
           AND substr(data, 6, 2) = ?
         ORDER BY criado_em DESC`,
        [usuario_id, q]
      );

    // Nome (prefixo indexável)
    } else {
      resultados = await db.all(
        `SELECT id, cliente, data, hora, tipo
         FROM sessoes
         WHERE usuario_id = ?
           AND cliente >= ?
           AND cliente < ?
         ORDER BY criado_em DESC`,
        [usuario_id, q, q + '\uffff']
      );
    }

    res.json(resultados);

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro na busca" });
  }
});



// READ ONE
app.get("/api/sessoes/:id", auth, async (req, res) => {
  const usuario_id = req.user.id;

  const sessao = await db.get(
    `SELECT *
     FROM sessoes
     WHERE id = ? AND usuario_id = ?`,
    [req.params.id, usuario_id]
  );

  if (!sessao) {
    return res.status(404).json({ erro: "Sessão não encontrada" });
  }

  res.json(sessao);
});

// UPDATE
app.put("/api/sessoes/:id", auth, async (req, res) => {
  const usuario_id = req.user.id;
  const { cliente, data, hora, tipo, transcricao, nota } = req.body;

  const result = await db.run(
    `UPDATE sessoes
     SET cliente=?, data=?, hora=?, tipo=?, transcricao=?, nota=?
     WHERE id=? AND usuario_id=?`,
    [cliente, data, hora, tipo, transcricao, nota, req.params.id, usuario_id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ erro: "Sessão não encontrada" });
  }

  res.json({ ok: true });
});


// DELETE
app.delete("/api/sessoes/:id", auth, async (req, res) => {
  const usuario_id = req.user.id;

  const result = await db.run(
    `DELETE FROM sessoes
     WHERE id = ? AND usuario_id = ?`,
    [req.params.id, usuario_id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ erro: "Sessão não encontrada" });
  }

  res.json({ ok: true });
});


/* ===========================
   LOGIN E CADASTRO DE USUÁRIO
=========================== */

// CADASTRO
app.post("/api/registro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  try {
    const senha_hash = await bcrypt.hash(senha, 10);

    await db.run(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES (?, ?, ?)`,
      [nome, email, senha_hash]
    );

    res.json({ ok: true });

  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT") {
      return res.status(409).json({ erro: "Email já cadastrado" });
    }
    console.error(err);
    res.status(500).json({ erro: "Erro ao registrar usuário" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  const usuario = await db.get(
    `SELECT * FROM usuarios WHERE email = ?`,
    [email]
  );

  if (!usuario) {
    return res.status(401).json({ erro: "Usuário não encontrado" });
  }

  const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);

  if (!senhaOk) {
    return res.status(401).json({ erro: "Senha incorreta" });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    }
  });
});



// MIDDLEWARE DE AUTENTICAÇÃO
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token malformado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido" });
  }
}

/* ===========================
   GERAR PDF
=========================== */

app.get("/api/sessoes/:id/pdf", auth, async (req, res) => {
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
