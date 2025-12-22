import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Permite ler JSON
app.use(express.json());

/**
 * 1️⃣ SERVIR ARQUIVOS ESTÁTICOS
 * Tudo que estiver em /public fica acessível
 */
app.use(express.static("public"));

/**
 * 2️⃣ ENDPOINT DA IA
 */
app.post("/gerar-nota", async (req, res) => {
  try {
    const { dadosSessao, transcricao } = req.body;

    if (!transcricao) {
      return res.status(400).json({ error: "Transcrição vazia" });
    }

    const prompt = `
Gere uma nota profissional de sessão.

CLIENTE: ${dadosSessao.cliente}
DATA: ${dadosSessao.data}
HORA: ${dadosSessao.hora}
DURAÇÃO: ${dadosSessao.duracao} minutos
INTENÇÃO: ${dadosSessao.intencao}

TRANSCRIÇÃO:
${transcricao}
`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Você gera notas profissionais." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        })
      }
    );

    const data = await response.json();
    res.json({ nota: data.choices[0].message.content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/**
 * 3️⃣ INICIAR SERVIDOR
 */
app.listen(PORT, () => {
  console.log(`🚀 App rodando em http://localhost:${PORT}`);
});
