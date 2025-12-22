/**
 * Backend seguro para integração com OpenAI
 * A API Key fica SOMENTE aqui
 */

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Permite que o frontend chame este backend
app.use(cors());

// Permite JSON no body
app.use(express.json());

/**
 * Endpoint que gera a nota usando OpenAI
 */
app.post("/gerar-nota", async (req, res) => {
  try {
    const { dadosSessao, transcricao } = req.body;

    if (!transcricao) {
      return res.status(400).json({ error: "Transcrição vazia" });
    }

    const prompt = `
Você é um assistente profissional especializado em gerar notas de sessão.

DADOS DA SESSÃO:
Cliente: ${dadosSessao.cliente}
Data: ${dadosSessao.data}
Hora: ${dadosSessao.hora}
Duração: ${dadosSessao.duracao} minutos
Intenção do cliente: ${dadosSessao.intencao}

TRANSCRIÇÃO:
${transcricao}

Gere uma NOTA PROFISSIONAL estruturada com:
- Cabeçalho
- Resumo
- Pontos principais
- Intervenções
- Encaminhamentos
- Observações
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
    const nota = data.choices[0].message.content;

    res.json({ nota });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar nota" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
