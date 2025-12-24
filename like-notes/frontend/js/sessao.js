async function gerarNota() {
  const dados = {
    cliente: cliente.value,
    data: data.value,
    hora: hora.value,
    tipo: tipo.value,
    transcricao: transcricao.value
  };

  nota.value = "Gerando nota...";

  const res = await fetch("http://localhost:3000/api/gerar-nota", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });

  const json = await res.json();
  nota.value = json.nota;
}

let sessaoEditandoId = null;
let horaOriginal = null;

async function salvarSessao() {

  // 🚨 ALERTA SOMENTE EM EDIÇÃO
  if (sessaoEditandoId !== null && hora.value === horaOriginal) {
    alert("Para atualizar a sessão, altere o horário.");
    return;
  }

  // daqui pra baixo continua seu fluxo normal
  await fetch("http://localhost:3000/api/sessoes", {
    method: "POST", // ou PUT futuramente
    headers: { "Content-Type": "application/json" },
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
