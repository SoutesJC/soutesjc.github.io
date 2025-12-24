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

async function salvarSessao() {
  await fetch("http://localhost:3000/api/sessoes", {
    method: "POST",
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
}
