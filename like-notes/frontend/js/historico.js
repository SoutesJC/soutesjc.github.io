window.carregarHistorico = carregarHistorico;
window.abrirSessao = abrirSessao;
window.excluir = excluir;


async function carregarHistorico() {
  const lista = document.getElementById("listaSessoes");
  lista.innerHTML = "";

  const res = await fetch("http://localhost:3000/api/sessoes");
  const sessoes = await res.json();

  sessoes.forEach(s => {
    const div = document.createElement("div");
    div.className = "sessao-item";
    div.innerHTML = `
      <strong>${s.cliente}</strong>
      ${s.data} ${s.hora} - ${s.tipo}
      <button onclick="editar(${s.id})">✏️</button>
      <button onclick="excluir(${s.id})">🗑️</button>
    `;
    lista.appendChild(div);
  });
}

async function editar(id) {
  const res = await fetch(`http://localhost:3000/api/sessoes/${id}`);
  const s = await res.json();

    sessaoEditandoId = id;
    horaOriginal = s.hora;

  mostrarTela("cadastro");

  cliente.value = s.cliente;
  data.value = s.data;
  hora.value = s.hora;
  tipo.value = s.tipo;
  transcricao.value = s.transcricao;
  nota.value = s.nota;
}

async function excluir(id) {
  if (!confirm("Excluir sessão?")) return;

  await fetch(`http://localhost:3000/api/sessoes/${id}`, {
    method: "DELETE"
  });

  carregarHistorico();
}
