function usuarioLogado() {
  return !!localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  location.reload();
}
