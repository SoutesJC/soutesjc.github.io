async function gerarNota() {
  const dados = {
    cliente: cliente.value,
    data: data.value,
    hora: hora.value,
    tipo: tipo.value,
    transcricao: transcricao.value
  };

  nota.value = "Gerando nota...";

await fetch(`${API_URL}/api/sessoes`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  },
  body: JSON.stringify({dados})
});


  const json = await res.json();
  nota.value = json.nota;
}


async function gerarNotaPorAudio() {
  const fileInput = document.getElementById("audioFile");

  if (!fileInput.files.length) {
    alert("Selecione um arquivo de áudio");
    return;
  }

  const formData = new FormData();
  formData.append("audio", fileInput.files[0]);

  // dados da sessão continuam sendo enviados
  formData.append("cliente", cliente.value);
  formData.append("data", data.value);
  formData.append("hora", hora.value);
  formData.append("tipo", tipo.value);

  nota.value = "Processando áudio e gerando nota...";

  try {
    const res = await fetch(
      "http://localhost:3000/api/gerar-nota-audio",
      {
        method: "POST",
        body: formData
      }
    );

    const json = await res.json();

    // backend devolve a transcrição também
    transcricao.value = json.transcricao;
    nota.value = json.nota;

  } catch (err) {
    console.error(err);
    alert("Erro ao processar áudio");
  }
}

let sessaoEditandoId = null;
let horaOriginal = null;

async function salvarSessao() {

  if (!usuarioLogado()) {
    alert("Faça login para salvar sessões.");
    mostrarTela('cadastro');
    return;
  }
  
  const token = localStorage.getItem("token");
  
  // SOMENTE EM EDIÇÃO
  if (sessaoEditandoId !== null && hora.value === horaOriginal) {
    alert("Para atualizar a sessão, altere o horário.");
    return;
  }

  // daqui pra baixo continua seu fluxo normal
  await fetch(`${API_URL}/api/sessoes`, {
    method: "POST", // ou PUT futuramente
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      cliente: cliente.value,
      data: data.value,
      hora: hora.value,
      tipo: tipo.value,
      transcricao: transcricao.value,
      nota: nota.value
    })
  });

  alert("Sessão salva!");
  novaSessao();

  // 🔄 limpa estado
  sessaoEditandoId = null;
  horaOriginal = null;
}
