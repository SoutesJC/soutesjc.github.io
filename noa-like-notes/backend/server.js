import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

/*
  CORS MANUAL (aceita file://, localhost e OPTIONS)
*/
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/gerar-nota", async (req, res) => {
  console.log("📥 Requisição recebida");

  try {
    const { cliente, data, hora, tipo, transcricao } = req.body;

    const prompt = `
Gere uma nota profissional baseada nesta sessão:

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

    res.json({
      nota: resposta.choices[0].message.content
    });

  } catch (erro) {
    console.error("❌ Erro:", erro.message);
    res.status(500).json({ erro: erro.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Backend rodando em http://localhost:3000");
});
