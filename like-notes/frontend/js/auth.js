const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://like-notes.onrender.com";

function usuarioLogado() {
  return !!localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  location.reload();
}

function authHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

