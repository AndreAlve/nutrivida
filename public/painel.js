if (!localStorage.getItem('adminLogado')) {
  window.location.href = '/admin.html'
}

function sair() {
  localStorage.removeItem('adminLogado')
  window.location.href = '/admin.html'
}

// ===== CONTROLE DE NOTIFICAÇÕES =====
let ultimosPedidosIds = null   // null = primeira carga, não notifica
let pedidosNovos = new Set()   // ids dos pedidos que ainda não foram vistos
let intervaloPoll = null

// Som de sino gerado via Web Audio API (sem arquivo externo)
function tocarSino() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    function nota(freq, inicio, duracao) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + inicio)
      gain.gain.setValueAtTime(0, ctx.currentTime + inicio)
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + inicio + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracao)
      osc.start(ctx.currentTime + inicio)
      osc.stop(ctx.currentTime + inicio + duracao)
    }

    // Acorde de sino: três notas em sequência
    nota(880, 0,    0.6)
    nota(1100, 0.15, 0.5)
    nota(1320, 0.3,  0.8)
  } catch (e) {
    console.log('Audio não disponível:', e)
  }
}

// Pisca o título da aba com a contagem de novos pedidos
let piscandoTitulo = null
function piscarTitulo(qtd) {
  if (piscandoTitulo) return // já está piscando
  let original = document.title
  let mostrandoAlerta = false
  piscandoTitulo = setInterval(() => {
    document.title = mostrandoAlerta
      ? original
      : `🔔 (${qtd}) Pedido${qtd > 1 ? 's' : ''} Novo${qtd > 1 ? 's' : ''}!`
    mostrandoAlerta = !mostrandoAlerta
  }, 1000)
}

function pararPiscar() {
  if (piscandoTitulo) {
    clearInterval(piscandoTitulo)
    piscandoTitulo = null
    document.title = 'Painel Admin - Nutri+Vida'
  }
}

// Banner de notificação no topo da seção de pedidos
function mostrarBannerNovoPedido(qtd) {
  let banner = document.getElementById('banner-novo-pedido')
  if (!banner) {
    banner = document.createElement('div')
    banner.id = 'banner-novo-pedido'
    banner.style = `
      background: linear-gradient(135deg, #2d5a3d, #1a3a2a);
      color: #e8b84b; padding: 14px 20px; border-radius: 10px;
      margin-bottom: 16px; display: flex; align-items: center;
      justify-content: space-between; gap: 12px;
      border: 2px solid #c8941a; animation: pulsar 1.2s ease-in-out infinite;
      font-family: Georgia, serif; font-size: 1rem;
    `
    const secao = document.getElementById('lista-pedidos')
    secao.parentElement.insertBefore(banner, secao)
  }
  banner.innerHTML = `
    <span>🔔 ${qtd} novo${qtd > 1 ? 's' : ''} pedido${qtd > 1 ? 's' : ''} chegou!</span>
    <button onclick="dispensarNotificacao()" style="
      background: #c8941a; color: #1a3a2a; border: none;
      border-radius: 6px; padding: 6px 14px; cursor: pointer;
      font-weight: bold; font-family: Georgia, serif;
    ">✓ Vi!</button>
  `
}

function dispensarNotificacao() {
  pedidosNovos.clear()
  pararPiscar()
  const banner = document.getElementById('banner-novo-pedido')
  if (banner) banner.remove()
  carregarPedidos() // recarrega sem o destaque
}

// ===== POLLING: verifica novos pedidos a cada 30s =====
async function verificarNovos() {
  try {
    const resposta = await fetch('/pedidos')
    const pedidos = await resposta.json()
    const idsAtuais = pedidos.map(p => p.id)

    if (ultimosPedidosIds === null) {
      // Primeira carga — só registra, não notifica
      ultimosPedidosIds = new Set(idsAtuais)
      return
    }

    // Descobre quais ids são realmente novos
    const novos = idsAtuais.filter(id => !ultimosPedidosIds.has(id))

    if (novos.length > 0) {
      novos.forEach(id => {
        pedidosNovos.add(id)
        ultimosPedidosIds.add(id)
      })
      tocarSino()
      piscarTitulo(pedidosNovos.size)
      mostrarBannerNovoPedido(pedidosNovos.size)
      carregarPedidos() // atualiza a lista com os novos
    }
  } catch (e) {
    console.log('Erro no polling:', e)
  }
}

function iniciarPolling() {
  verificarNovos() // roda imediatamente pra registrar estado inicial
  intervaloPoll = setInterval(verificarNovos, 30000) // a cada 30s
}

// ===== CADASTRAR PRODUTO =====
async function cadastrarProduto() {
  const nome = document.getElementById('nome').value
  const preco = document.getElementById('preco').value
  const descricao = document.getElementById('descricao').value
  const estoque = document.getElementById('estoque').value
  const foto = document.getElementById('foto').files[0]

  const formData = new FormData()
  const unidade = document.getElementById('unidade').value
  formData.append('nome', nome)
  formData.append('preco', preco)
  formData.append('descricao', descricao)
  formData.append('estoque', estoque)
  formData.append('unidade', unidade)
  if (foto) formData.append('foto', foto)

  const resposta = await fetch('/produtos', { method: 'POST', body: formData })
  const dados = await resposta.json()
  document.getElementById('msg-cadastro').textContent = dados.mensagem

  document.getElementById('nome').value = ''
  document.getElementById('preco').value = ''
  document.getElementById('descricao').value = ''
  document.getElementById('estoque').value = ''
  document.getElementById('foto').value = ''

  carregarProdutos()
}

// ===== CARREGAR PRODUTOS =====
async function carregarProdutos() {
  const resposta = await fetch('/produtos')
  const produtos = await resposta.json()
  const lista = document.getElementById('lista-admin')
  lista.innerHTML = ''

  if (produtos.length === 0) {
    lista.innerHTML = '<p style="color:#888;font-style:italic">Nenhum produto cadastrado ainda.</p>'
    return
  }

  produtos.forEach(produto => {
    const card = document.createElement('div')
    card.classList.add('card-admin')
    card.innerHTML = `
      ${produto.foto ? `<img src="/${produto.foto}" style="width:100%;border-radius:8px;margin-bottom:8px;object-fit:cover;height:140px;">` : ''}
      <h3>${produto.nome}</h3>
      <p>R$ ${parseFloat(produto.preco).toFixed(2)}</p>
      <p style="color:#555;font-size:0.85rem;font-weight:normal">${produto.descricao}</p>
      <p style="color:#555;font-size:0.85rem;font-weight:normal">Estoque: ${produto.estoque}</p>
      <button onclick="abrirEdicao(${produto.id}, '${produto.nome}', ${produto.preco}, '${produto.descricao}', ${produto.estoque}, '${produto.foto || ''}', '${produto.unidade || 'unidade'}')"
        style="background:#c8941a;margin-bottom:6px">✏️ Editar</button>
      <button onclick="excluirProduto(${produto.id})">🗑 Excluir</button>
    `
    lista.appendChild(card)
  })
}

async function excluirProduto(id) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return
  const resposta = await fetch(`/produtos/${id}`, { method: 'DELETE' })
  const dados = await resposta.json()
  alert(dados.mensagem)
  carregarProdutos()
}

function abrirEdicao(id, nome, preco, descricao, estoque, fotoAtual, unidadeAtual) {
  const modal = document.createElement('div')
  modal.id = 'modal-edicao'
  modal.style = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.5);display:flex;
    align-items:center;justify-content:center;z-index:999;
    overflow-y:auto;padding:20px;
  `
  modal.innerHTML = `
    <div style="background:#faf7f2;padding:30px;border-radius:12px;width:100%;max-width:420px;border-top:4px solid #c8941a">
      <h3 style="margin-bottom:16px;color:#1a3a2a">Editar Produto</h3>
      <input id="edit-nome" type="text" value="${nome}" placeholder="Nome"
        style="width:100%;padding:10px;margin-bottom:10px;border:2px solid #ddd;border-radius:8px;font-size:1rem">
      <input id="edit-preco" type="number" value="${preco}" placeholder="Preço" step="0.01"
        style="width:100%;padding:10px;margin-bottom:10px;border:2px solid #ddd;border-radius:8px;font-size:1rem">
      <input id="edit-descricao" type="text" value="${descricao}" placeholder="Descrição"
        style="width:100%;padding:10px;margin-bottom:10px;border:2px solid #ddd;border-radius:8px;font-size:1rem">
      <input id="edit-estoque" type="number" value="${estoque}" placeholder="Estoque"
        style="width:100%;padding:10px;margin-bottom:10px;border:2px solid #ddd;border-radius:8px;font-size:1rem">
      <label style="font-size:0.9rem;color:#555;display:block;margin-bottom:6px">⚖️ Venda por:</label>
      <select id="edit-unidade" style="width:100%;padding:10px;margin-bottom:10px;border:2px solid #ddd;border-radius:8px;font-size:1rem">
        <option value="unidade" ${unidadeAtual === 'unidade' ? 'selected' : ''}>📦 Unidade (peça)</option>
        <option value="grama" ${unidadeAtual === 'grama' ? 'selected' : ''}>⚖️ Peso (gramas)</option>
      </select>
      <label style="font-size:0.9rem;color:#555;display:block;margin-bottom:6px">📷 Foto atual:</label>
      ${fotoAtual
        ? `<img src="/${fotoAtual}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;">`
        : `<p style="color:#aaa;font-style:italic;font-size:0.85rem;margin-bottom:8px">Sem foto cadastrada</p>`
      }
      <label style="font-size:0.9rem;color:#555;display:block;margin-bottom:6px">🔄 Trocar foto (deixe vazio para manter):</label>
      <input id="edit-foto" type="file" accept="image/*"
        style="width:100%;padding:8px;margin-bottom:16px;border:2px solid #ddd;border-radius:8px;font-size:0.9rem">
      <div style="display:flex;gap:10px">
        <button onclick="salvarEdicao(${id})"
          style="flex:1;padding:10px;background:#1a3a2a;color:#e8b84b;border:none;border-radius:8px;cursor:pointer;font-size:1rem">
          💾 Salvar
        </button>
        <button onclick="document.getElementById('modal-edicao').remove()"
          style="flex:1;padding:10px;background:#aaa;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem">
          Cancelar
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

async function salvarEdicao(id) {
  const nome = document.getElementById('edit-nome').value
  const preco = document.getElementById('edit-preco').value
  const descricao = document.getElementById('edit-descricao').value
  const estoque = document.getElementById('edit-estoque').value
  const foto = document.getElementById('edit-foto').files[0]
  const unidade = document.getElementById('edit-unidade').value

  if (foto) {
    const formData = new FormData()
    formData.append('nome', nome)
    formData.append('preco', preco)
    formData.append('descricao', descricao)
    formData.append('estoque', estoque)
    formData.append('unidade', unidade)
    formData.append('foto', foto)
    const resposta = await fetch(`/produtos/${id}`, { method: 'PUT', body: formData })
    const dados = await resposta.json()
    alert(dados.mensagem)
  } else {
    const resposta = await fetch(`/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco, descricao, estoque, unidade })
    })
    const dados = await resposta.json()
    alert(dados.mensagem)
  }

  document.getElementById('modal-edicao').remove()
  carregarProdutos()
}

function formatarTelefoneWhatsApp(telefone) {
  const soNumeros = telefone.replace(/\D/g, '')
  if (soNumeros.startsWith('55') && soNumeros.length >= 12) return soNumeros
  return '55' + soNumeros
}

function enviarWhatsApp(telefone, nomeCliente, endereco) {
  const numero = formatarTelefoneWhatsApp(telefone)
  const ehEntrega = endereco && !endereco.toLowerCase().includes('retirada') && endereco.trim() !== ''
  const mensagem = ehEntrega
    ? `Olá, ${nomeCliente}! 🌿\n\nSeu pedido da *Nutri+Vida* está a caminho! 🚚\n\nQualquer dúvida é só chamar! 🌿`
    : `Olá, ${nomeCliente}! 🌿\n\nSeu pedido da *Nutri+Vida* está pronto para retirada! ✅\n\nPode vir buscar quando quiser. Te esperamos! 🌿`
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank')
}

// ===== CARREGAR PEDIDOS =====
async function carregarPedidos() {
  const resposta = await fetch('/pedidos')
  const pedidos = await resposta.json()
  const lista = document.getElementById('lista-pedidos')
  lista.innerHTML = ''

  if (pedidos.length === 0) {
    lista.innerHTML = '<p style="color:#888;font-style:italic">Nenhum pedido recebido ainda.</p>'
    return
  }

  for (const pedido of pedidos) {
    const card = document.createElement('div')
    card.classList.add('card-pedido')

    // Destaque visual para pedidos novos ainda não dispensados
    const ehNovo = pedidosNovos.has(pedido.id)
    if (ehNovo) {
      card.style.border = '2px solid #c8941a'
      card.style.animation = 'pulsar 1.2s ease-in-out 3'
      card.setAttribute('data-novo', 'true')
    }

    const isPronto = pedido.status_pedido === 'pronto'
    const endereco = pedido.endereco || ''

    let itensHTML = ''
    try {
      const resItens = await fetch(`/pedidos/${pedido.id}/itens`)
      const itens = await resItens.json()
      if (itens.length === 0) {
        itensHTML = '<p style="color:#aaa;font-style:italic;font-size:0.85rem">Nenhum produto registrado.</p>'
      } else {
        const total = itens.reduce((soma, item) => soma + parseFloat(item.preco) * item.quantidade, 0)
        itensHTML = `
          <div style="background:#f0ece4;border-radius:8px;padding:10px 12px;margin:10px 0;border-left:3px solid #c8941a;">
            <p style="font-weight:bold;color:#1a3a2a;margin-bottom:6px;font-size:0.9rem">🛒 Produtos do Pedido:</p>
            <ul style="list-style:none;padding:0;margin:0">
              ${itens.map(item => `
                <li style="display:flex;justify-content:space-between;font-size:0.88rem;color:#333;padding:3px 0;border-bottom:1px solid #ddd;">
                  <span>• ${item.nome_produto} x${item.quantidade}</span>
                  <span style="color:#c8941a;font-weight:bold">R$ ${(parseFloat(item.preco) * item.quantidade).toFixed(2)}</span>
                </li>
              `).join('')}
            </ul>
            <p style="text-align:right;font-weight:bold;color:#1a3a2a;margin-top:8px;font-size:0.95rem">
              Total: R$ ${total.toFixed(2)}
            </p>
          </div>
        `
      }
    } catch (e) {
      itensHTML = '<p style="color:#e74c3c;font-size:0.85rem">Erro ao carregar produtos.</p>'
    }

    card.innerHTML = `
      ${ehNovo ? '<div style="background:#c8941a;color:#1a3a2a;padding:4px 12px;border-radius:6px;font-size:0.8rem;font-weight:bold;display:inline-block;margin-bottom:8px;">🆕 Novo Pedido!</div>' : ''}
      <h3>👤 ${pedido.cliente_nome}</h3>
      <p>📞 ${pedido.telefone}</p>
      <p>📍 ${endereco || 'Retirada na Loja'}</p>
      <p>💳 ${pedido.forma_pagamento || '-'}</p>
      <p>📅 ${new Date(pedido.data_pedido).toLocaleString('pt-BR')}</p>
      ${itensHTML}
      <span class="status" style="background:${isPronto ? '#2d5a3d' : ''};color:${isPronto ? 'white' : ''}">
        ${isPronto ? '✅ pronto' : '⏳ pendente'}
      </span>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        ${isPronto ? `<button onclick="enviarWhatsApp('${pedido.telefone}', '${pedido.cliente_nome}', '${endereco}')"
                  style="flex:1;min-width:140px;padding:10px;background:#25D366;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold">
        📲 Reenviar WhatsApp
            </button>` : `<button onclick="marcarPronto(${pedido.id}, '${pedido.telefone}', '${pedido.cliente_nome}', '${endereco}')"
                      style="flex:1;min-width:140px;padding:10px;background:#2d5a3d;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold">
                ✅ Marcar Pronto
                    </button>`
        }
        <button onclick="deletarPedido(${pedido.id})"
          style="flex:1;min-width:140px;padding:10px;background:#e74c3c;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold">
          🗑 Remover
        </button>
      </div>
    `
    lista.appendChild(card)
  }
}

async function marcarPronto(id, telefone, nomeCliente, endereco) {
  await fetch(`/pedidos/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'pronto' })
  })
  enviarWhatsApp(telefone, nomeCliente, endereco)
  carregarPedidos()
}

async function deletarPedido(id) {
  if (!confirm('Remover este pedido?')) return
  await fetch(`/pedidos/${id}`, { method: 'DELETE' })
  carregarPedidos()
}

// ===== INICIALIZA =====
// Adiciona a animação de pulsar no CSS dinamicamente
const style = document.createElement('style')
style.textContent = `
  @keyframes pulsar {
    0%, 100% { box-shadow: 0 0 0 0 rgba(200, 148, 26, 0.5); }
    50% { box-shadow: 0 0 0 10px rgba(200, 148, 26, 0); }
  }
`
document.head.appendChild(style)

carregarProdutos()
carregarPedidos()
iniciarPolling()