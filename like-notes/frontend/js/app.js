function mostrarTela(tela) {
  document.getElementById("tela-cadastro").classList.add("hidden");
  document.getElementById("tela-historico").classList.add("hidden");

  document.getElementById(`tela-${tela}`).classList.remove("hidden");

  if (tela === "historico") carregarHistorico();
}

function novaSessao() {
  // Campos da sessão
  document.getElementById("cliente").value = "";
  document.getElementById("data").value = "";
  document.getElementById("hora").value = "";
  document.getElementById("tipo").value = "";

  // Conteúdo
  document.getElementById("transcricao").value = "";
  document.getElementById("nota").value = "";

  // Status
  const status = document.getElementById("status");
  if (status) status.innerText = "";

  // Botões de gravação
  const btnGravar = document.getElementById("btnGravar");
  const btnParar = document.getElementById("btnParar");

  if (btnGravar && btnParar) {
    btnGravar.disabled = false;
    btnParar.disabled = true;
  }

  // Segurança: parar gravação se estiver ativa
  if (window.recognition && window.gravando) {
    window.gravando = false;
    window.recognition.stop();
  }
}
