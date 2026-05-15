// =========================
// RECUPERA CARRINHO
// =========================
let itensCarrinho = []

try {
  itensCarrinho =
    JSON.parse(localStorage.getItem('carrinhoNutriVida')) || []
} catch {
  itensCarrinho = []
}


// =========================
// VOLTAR PARA LOJA
// =========================
function voltarLoja() {
  window.location.href = '/index.html'
}


// =========================
// ENTREGA
// =========================
function mudarEntrega() {
  const tipo = document.getElementById('tipo-entrega')?.value
  const divEndereco = document.getElementById('div-endereco')
  const divLoja = document.getElementById('div-loja')

  if (!divEndereco || !divLoja) return

  if (tipo === 'entrega') {
    divEndereco.classList.remove('oculto')
    divLoja.classList.add('oculto')
  } else if (tipo === 'retirada') {
    divEndereco.classList.add('oculto')
    divLoja.classList.remove('oculto')
  } else {
    divEndereco.classList.add('oculto')
    divLoja.classList.add('oculto')
  }

  mudarPagamento()
}


// =========================
// PAGAMENTO
// =========================
function mudarPagamento() {
  const pag = document.getElementById('forma-pagamento')?.value
  const entrega = document.getElementById('tipo-entrega')?.value

  const divMaquineta = document.getElementById('div-maquineta')
  const divPix = document.getElementById('div-pix')

  if (!divMaquineta || !divPix) return

  if (pag === 'cartao' && entrega === 'entrega') {
    divMaquineta.classList.remove('oculto')
  } else {
    divMaquineta.classList.add('oculto')
  }

  if (pag === 'pix') {
    divPix.classList.remove('oculto')
  } else {
    divPix.classList.add('oculto')
  }
}


// =========================
// COPIAR PIX
// =========================
function copiarPix() {
  const chaveInput = document.getElementById('chave-pix')
  const msg = document.getElementById('msg-pix-copiado')

  if (!chaveInput || !msg) return

  const chave = chaveInput.value

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(chave)
      .then(() => mostrarMsgPix(msg))
      .catch(() => copiarFallback(chaveInput, msg))
  } else {
    copiarFallback(chaveInput, msg)
  }
}

function copiarFallback(input, msg) {
  input.select()
  input.setSelectionRange(0, 99999)

  try {
    document.execCommand('copy')
    mostrarMsgPix(msg)
  } catch {
    alert('Copie manualmente a chave PIX.')
  }
}

function mostrarMsgPix(msg) {
  msg.style.display = 'block'
  setTimeout(() => {
    msg.style.display = 'none'
  }, 2500)
}


// =========================
// ENVIAR PEDIDO
// =========================
async function enviarPedido() {
  const nome = document.getElementById('nome-cliente')?.value.trim()
  const telefone = document.getElementById('telefone-cliente')?.value.trim()
  const tipoEntrega = document.getElementById('tipo-entrega')?.value
  const pagamento = document.getElementById('forma-pagamento')?.value
  const maquineta = document.getElementById('precisa-maquineta')?.value

  const endereco =
    tipoEntrega === 'entrega'
      ? document.getElementById('endereco-cliente')?.value.trim()
      : 'Retirada na Loja'

  // validações
  if (!nome) {
    alert('Digite seu nome')
    return
  }

  if (!telefone || telefone.length < 8) {
    alert('Telefone inválido')
    return
  }

  if (tipoEntrega === 'selecione') {
    alert('Escolha a entrega')
    return
  }

  if (tipoEntrega === 'entrega' && !endereco) {
    alert('Digite o endereço')
    return
  }

  if (pagamento === 'selecione') {
    alert('Escolha a forma de pagamento')
    return
  }

  if (itensCarrinho.length === 0) {
    alert('Carrinho vazio')
    return
  }

  const itens = itensCarrinho.map(item => ({
    produto_id: item.produto_id,
    quantidade: item.quantidade || 1
  }))

  const pedido = {
    cliente_nome: nome,
    telefone,
    endereco,
    forma_pagamento: pagamento,
    precisa_maquineta:
      pagamento === 'cartao' && tipoEntrega === 'entrega'
        ? maquineta
        : 'N/A',
    itens
  }

  try {
    const btn = document.getElementById('btn-enviar')
    if (btn) btn.disabled = true

    const resposta = await fetch('/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedido)
    })

    const resultado = await resposta.json()

    if (resposta.ok) {
      localStorage.removeItem('carrinhoNutriVida')

      if (pagamento === 'pix') {
        alert('Pedido enviado 🌿\nFinalize o PIX.')
      } else {
        alert('Pedido realizado com sucesso 🌿')
      }

      window.location.href = '/index.html'
    } else {
      alert(resultado.erro || 'Erro ao enviar pedido')
    }

  } catch (erro) {
    console.error(erro)
    alert('Erro ao conectar com servidor')
  }
}


// =========================
// INICIALIZA
// =========================
document.addEventListener('DOMContentLoaded', () => {
  mudarEntrega()
  mudarPagamento()
})