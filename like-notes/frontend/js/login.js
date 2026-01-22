// ===============================
// ESTADO DE LOGIN
// ===============================
function usuarioLogado() {
  return !!localStorage.getItem("token");
}

// ===============================
// UI - AUTH AREA (barra superior)
// ===============================
function renderAuthArea() {
  const authArea = document.getElementById("authArea");

  if (!usuarioLogado()) {
    authArea.innerHTML = `
      <button onclick="abrirLoginModal()" class="login-btn">
        👤 Entrar
      </button>
    `;
  } else {
    const user = JSON.parse(localStorage.getItem("usuario"));

    authArea.innerHTML = `
      <div class="user-info">
        👤 <span>${user.nome}</span>
        <button onclick="logout()">Sair</button>
      </div>
    `;
  }
}

let modoCadastro = false;

function alternarAuth() {
  modoCadastro = !modoCadastro;

  document.getElementById("loginTitulo").innerText =
    modoCadastro ? "Criar Conta" : "Entrar";

  document.getElementById("loginNome")
    .classList.toggle("hidden", !modoCadastro);

  document.getElementById("btnLogin")
    .classList.toggle("hidden", modoCadastro);

  document.getElementById("btnCadastrar")
    .classList.toggle("hidden", !modoCadastro);

  document.getElementById("textoTroca").innerText =
    modoCadastro ? "Já tem conta?" : "Não tem conta?";

  document.querySelector(".troca-auth a").innerText =
    modoCadastro ? "Entrar" : "Criar conta";

  document.getElementById("erroLogin").innerText = "";
}

// ===============================
// MODAL DE LOGIN
// ===============================
function abrirLoginModal() {
  document.getElementById("loginModal").classList.remove("hidden");
}

function fecharLoginModal() {
  document.getElementById("loginModal").classList.add("hidden");
}

// ===============================
// LOGIN
// ===============================
async function login() {
  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  const res = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha })
  });

  const json = await res.json();

  if (!res.ok) {
    alert(json.erro || "Erro no login");
    return;
  }

  localStorage.setItem("token", json.token);
  localStorage.setItem("usuario", JSON.stringify(json.usuario));

  fecharLoginModal();
  renderAuthArea();
}

// ===============================
// CADASTRO
// ===============================
async function cadastrar() {
  const nome = document.getElementById("loginNome").value.trim();
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;

  if (!nome || !email || !senha) {
    document.getElementById("erroLogin").innerText =
      "Preencha nome, email e senha";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha })
    });

    const json = await res.json();

    if (!res.ok) {
      document.getElementById("erroLogin").innerText =
        json.erro || "Erro ao criar usuário";
      return;
    }

    alert("Usuário criado com sucesso! Agora faça login.");
    alternarAuth(); // volta para login

    document.getElementById("loginNome").value = "";
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginSenha").value = "";

  } catch {
    document.getElementById("erroLogin").innerText =
      "Erro ao criar usuário";
  }
}



// ===============================
// LOGOUT
// ===============================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  renderAuthArea();
}

// ===============================
// INICIALIZAÇÃO
// ===============================
window.addEventListener("DOMContentLoaded", renderAuthArea);

// ===============================
// EXPOR FUNÇÕES
// ===============================
window.abrirLoginModal = abrirLoginModal;
window.fecharLoginModal = fecharLoginModal;
window.login = login;
window.logout = logout;
window.usuarioLogado = usuarioLogado;
window.cadastrar = cadastrar;
