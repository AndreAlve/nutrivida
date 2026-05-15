function entrar() {
  window.location.href = '/catálogo.html';
}

// ===== FUNÇÃO PARA ENTRAR NA LOJA =====
function entrarNaLoja() {
  const telaBoasVindas = document.getElementById('tela-boas-vindas');
  const conteudoLoja = document.getElementById('conteudo-loja');

  if (!telaBoasVindas || !conteudoLoja) return;

  // Adiciona animação de saída
  telaBoasVindas.classList.add('saindo');

  // Após a animação, esconde boas-vindas e mostra a loja
  setTimeout(() => {
    telaBoasVindas.style.display = 'none';
    conteudoLoja.classList.remove('oculto');

    // Carrega os produtos quando entra na loja
    if (typeof carregarProdutos === 'function') {
      carregarProdutos();
    }
  }, 600);
}