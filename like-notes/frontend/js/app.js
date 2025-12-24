function mostrarTela(tela) {
  document.getElementById("tela-cadastro").classList.add("hidden");
  document.getElementById("tela-historico").classList.add("hidden");

  document.getElementById(`tela-${tela}`).classList.remove("hidden");

  if (tela === "historico") carregarHistorico();
}
