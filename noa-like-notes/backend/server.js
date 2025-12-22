import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());            // Permite frontend acessar
app.use(express.json());    // Permite JSON no body

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/*
  ROTA PRINCIPAL
  Recebe dados da sessão + transcrição
  Retorna nota profissional gerada pela IA
*/
app.post("/api/gerar-nota", async (req, res) => {
  try {
    const { cliente, data, hora, tipo, transcricao } = req.body;

    const prompt = `
Você é um profissional que gera notas clínicas estruturadas.

Dados da sessão:
Cliente: ${cliente}
Data: ${data}
Hora: ${hora}
Tipo: ${tipo}

Transcrição da sessão:
${transcricao}

Gere uma nota profissional, clara e objetiva.
`;

    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um assistente profissional de documentação clínica." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      nota: resposta.choices[0].message.content
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao gerar nota com IA" });
  }
});

app.listen(process.env.PORT, () => {
  console.log("✅ Backend rodando em http://localhost:3000");
});
