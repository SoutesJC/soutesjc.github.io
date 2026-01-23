let debounceTimer = null;

window.carregarHistorico = carregarHistorico;
window.abrirSessao = abrirSessao;
window.excluir = excluir;


async function carregarHistorico() {

   if (!usuarioLogado()) {
    alert("Faça login para acessar o histórico.");
    mostrarTela("cadastro");
    return;
  }

  const res = await fetch(`${API_URL}/api/sessoes`, {
  headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  const sessoes = await res.json(); 
  renderizarHistorico(sessoes);
}


async function editar(id) {
  const res = await fetch(`${API_URL}/api/sessoes/${id}`);
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

  await fetch(`${API_URL}/api/sessoes/${id}`, {
    method: "DELETE"
  });

  carregarHistorico();
}

async function buscarHistorico() {
  const input = document.getElementById("buscaHistorico");
  const q = input.value.trim();

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    if (!q) {
      carregarHistorico(); // volta ao normal
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/sessoes/busca?q=${encodeURIComponent(q)}`
      );

      const resultados = await res.json();
      renderizarHistorico(resultados);

    } catch (err) {
      console.error("Erro na busca:", err);
    }
  }, 300); // 300ms é o ideal
}

function renderizarHistorico(sessoes) {
  const lista = document.getElementById("listaSessoes");
  lista.innerHTML = "";

  if (sessoes.length === 0) {
    lista.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    return;
  }

  sessoes.forEach(s => {
    const div = document.createElement("div");
    div.className = "sessao-item";
    div.innerHTML = `
      <strong>${s.cliente}</strong>
      ${s.data} ${s.hora} - ${s.tipo}
      <button onclick="editar(${s.id})">✏️</button>
      <button onclick="gerarPDF(${s.id})">📄 PDF</button>
      <button onclick="excluir(${s.id})">🗑️</button>
    `;
    lista.appendChild(div);
  });
}

function gerarPDF(id) {
  window.open(
    `http://localhost:3000/api/sessoes/${id}/pdf`,
    "_blank"
  );
}

