if (!localStorage.getItem('adminLogado')) {
  window.location.href = '/admin.html'
}

function sair() {
  localStorage.removeItem('adminLogado')
  window.location.href = '/admin.html'
}

/* =========================
   NOTIFICAÇÕES
========================= */
let ultimosPedidosIds = null
let pedidosNovos = new Set()
let intervaloPoll = null

function tocarSino() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    function nota(freq, inicio, duracao) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, ctx.currentTime + inicio)
      gain.gain.linearRampToValueAtTime(
        0.4,
        ctx.currentTime + inicio + 0.01
      )
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + inicio + duracao
      )

      osc.start(ctx.currentTime + inicio)
      osc.stop(ctx.currentTime + inicio + duracao)
    }

    nota(880, 0, 0.5)
    nota(1100, 0.15, 0.5)
    nota(1320, 0.3, 0.8)

  } catch (e) {
    console.log(e)
  }
}

function mostrarBannerNovoPedido(qtd) {
  let banner = document.getElementById('banner-novo-pedido')

  if (!banner) {
    banner = document.createElement('div')
    banner.id = 'banner-novo-pedido'
    banner.style =
      'background:#1a3a2a;color:#e8b84b;padding:15px;margin-bottom:20px;border-radius:8px'

    document
      .getElementById('lista-pedidos')
      .before(banner)
  }

  banner.innerHTML =
    `🔔 ${qtd} novo(s) pedido(s)!
     <button onclick="dispensarNotificacao()">✓ Vi</button>`
}

function dispensarNotificacao() {
  pedidosNovos.clear()

  const banner =
    document.getElementById('banner-novo-pedido')

  if (banner) banner.remove()

  carregarPedidos()
}

async function verificarNovos() {
  try {
    const resposta = await fetch('/pedidos')
    const pedidos = await resposta.json()

    const ids = pedidos.map(p => p._id)

    if (ultimosPedidosIds === null) {
      ultimosPedidosIds = new Set(ids)
      return
    }

    const novos =
      ids.filter(id => !ultimosPedidosIds.has(id))

    if (novos.length > 0) {
      novos.forEach(id => {
        pedidosNovos.add(id)
        ultimosPedidosIds.add(id)
      })

      tocarSino()
      mostrarBannerNovoPedido(novos.length)
      carregarPedidos()
    }

  } catch (e) {
    console.log(e)
  }
}

function iniciarPolling() {
  verificarNovos()
  intervaloPoll =
    setInterval(verificarNovos, 30000)
}

/* =========================
   CADASTRAR PRODUTO
========================= */
async function cadastrarProduto() {
  try {
    const formData = new FormData()

    formData.append(
      'nome',
      document.getElementById('nome').value
    )

    formData.append(
      'preco',
      document.getElementById('preco').value
    )

    formData.append(
      'descricao',
      document.getElementById('descricao').value
    )

    formData.append(
      'estoque',
      document.getElementById('estoque').value
    )

    formData.append(
      'unidade',
      document.getElementById('unidade').value
    )

    const foto =
      document.getElementById('foto').files[0]

    if (foto)
      formData.append('foto', foto)

    const resposta =
      await fetch('/produtos', {
        method: 'POST',
        body: formData
      })

    const dados =
      await resposta.json()

    alert(dados.mensagem || 'Produto criado')

    document.getElementById('nome').value = ''
    document.getElementById('preco').value = ''
    document.getElementById('descricao').value = ''
    document.getElementById('estoque').value = ''
    document.getElementById('foto').value = ''

    carregarProdutos()

  } catch (e) {
    console.log(e)
  }
}

/* =========================
   PRODUTOS
========================= */
async function carregarProdutos() {
  try {
    const resposta =
      await fetch('/produtos')

    const produtos =
      await resposta.json()

    const lista =
      document.getElementById('lista-admin')

    lista.innerHTML = ''

    if (!Array.isArray(produtos)
      || produtos.length === 0) {
      lista.innerHTML =
        '<p>Nenhum produto.</p>'
      return
    }

    produtos.forEach(produto => {
      const card =
        document.createElement('div')

      card.classList.add('card-admin')

      card.innerHTML = `
        ${produto.foto
          ? `<img src="${produto.foto}"
             style="width:100%;
             height:140px;
             object-fit:cover;
             border-radius:8px;">`
          : ''}

        <h3>${produto.nome}</h3>
        <p>R$ ${parseFloat(produto.preco).toFixed(2)}</p>
        <p>${produto.descricao}</p>
        <p>Estoque: ${produto.estoque}</p>

        <button onclick="abrirEdicao(
          '${produto._id}',
          '${produto.nome}',
          '${produto.preco}',
          '${produto.descricao}',
          '${produto.estoque}',
          '${produto.foto || ''}',
          '${produto.unidade || 'unidade'}'
        )">
          ✏️ Editar
        </button>

        <button onclick="excluirProduto('${produto._id}')">
          🗑 Excluir
        </button>
      `

      lista.appendChild(card)
    })

  } catch (e) {
    console.log(e)
  }
}

async function excluirProduto(id) {
  if (!confirm('Excluir produto?'))
    return

  await fetch(`/produtos/${id}`, {
    method: 'DELETE'
  })

  carregarProdutos()
}

function abrirEdicao(
  id,
  nome,
  preco,
  descricao,
  estoque,
  fotoAtual,
  unidade
) {
  const modal =
    document.createElement('div')

  modal.id = 'modal-edicao'

  modal.innerHTML = `
  <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.5);
      display:flex;
      justify-content:center;
      align-items:center;
      z-index:999;
  ">
    <div style="
      background:white;
      padding:20px;
      border-radius:10px;
      width:400px;
    ">
      <h2>Editar Produto</h2>

      <input id="edit-nome"
        value="${nome}"><br><br>

      <input id="edit-preco"
        value="${preco}"><br><br>

      <input id="edit-descricao"
        value="${descricao}"><br><br>

      <input id="edit-estoque"
        value="${estoque}"><br><br>

      <select id="edit-unidade">
        <option value="unidade"
        ${unidade === 'unidade' ? 'selected' : ''}>
        unidade
        </option>

        <option value="grama"
        ${unidade === 'grama' ? 'selected' : ''}>
        grama
        </option>
      </select>

      <br><br>

      ${fotoAtual
        ? `<img src="${fotoAtual}"
            style="width:100%;
            height:120px;
            object-fit:cover;">`
        : ''}

      <br><br>

      <input
        type="file"
        id="edit-foto">

      <br><br>

      <button onclick="salvarEdicao('${id}')">
        salvar
      </button>

      <button onclick="
        document.getElementById(
          'modal-edicao'
        ).remove()
      ">
        cancelar
      </button>
    </div>
  </div>
  `

  document.body.appendChild(modal)
}

async function salvarEdicao(id) {
  const formData = new FormData()

  formData.append(
    'nome',
    document.getElementById('edit-nome').value
  )

  formData.append(
    'preco',
    document.getElementById('edit-preco').value
  )

  formData.append(
    'descricao',
    document.getElementById('edit-descricao').value
  )

  formData.append(
    'estoque',
    document.getElementById('edit-estoque').value
  )

  formData.append(
    'unidade',
    document.getElementById('edit-unidade').value
  )

  const foto =
    document.getElementById('edit-foto').files[0]

  if (foto)
    formData.append('foto', foto)

  const resposta =
    await fetch(`/produtos/${id}`, {
      method: 'PUT',
      body: formData
    })

  const dados =
    await resposta.json()

  alert(dados.mensagem)

  document
    .getElementById('modal-edicao')
    .remove()

  carregarProdutos()
}

/* =========================
   WHATSAPP
========================= */
function enviarWhatsApp(
  telefone,
  nome
) {
  const numero =
    '55' +
    telefone.replace(/\D/g, '')

  const msg =
    `Olá ${nome}, seu pedido está pronto 🌿`

  window.open(
    `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`,
    '_blank'
  )
}

/* =========================
   PEDIDOS
========================= */
async function carregarPedidos() {
  try {
    const resposta =
      await fetch('/pedidos')

    const pedidos =
      await resposta.json()

    const lista =
      document.getElementById('lista-pedidos')

    lista.innerHTML = ''

    if (!Array.isArray(pedidos)
      || pedidos.length === 0) {
      lista.innerHTML =
        '<p>Nenhum pedido.</p>'
      return
    }

    for (const pedido of pedidos) {
      const card =
        document.createElement('div')

      card.classList.add('card-pedido')

      const novo =
        pedidosNovos.has(pedido._id)

      let itensHTML = ''

      const r =
        await fetch(
          `/pedidos/${pedido._id}/itens`
        )

      const itens =
        await r.json()

      itensHTML =
        itens.map(i =>
          `<p>${i.produto_id?.nome}
           x ${i.quantidade}</p>`
        ).join('')

      card.innerHTML = `
        ${novo ? '<h4>🆕 Novo</h4>' : ''}

        <h3>${pedido.cliente_nome}</h3>
        <p>${pedido.telefone}</p>
        <p>${pedido.endereco}</p>

        ${itensHTML}

        <button onclick="
          marcarPronto(
            '${pedido._id}',
            '${pedido.telefone}',
            '${pedido.cliente_nome}'
          )
        ">
          ✅ Pronto
        </button>

        <button onclick="
          deletarPedido(
            '${pedido._id}'
          )
        ">
          🗑 Remover
        </button>
      `

      lista.appendChild(card)
    }

  } catch (e) {
    console.log(e)
  }
}

async function marcarPronto(
  id,
  telefone,
  nome
) {
  await fetch(
    `/pedidos/${id}/status`,
    {
      method: 'PUT',
      headers: {
        'Content-Type':
          'application/json'
      },
      body: JSON.stringify({
        status: 'pronto'
      })
    }
  )

  enviarWhatsApp(
    telefone,
    nome
  )

  carregarPedidos()
}

async function deletarPedido(id) {
  if (!confirm('Excluir pedido?'))
    return

  await fetch(
    `/pedidos/${id}`,
    { method: 'DELETE' }
  )

  carregarPedidos()
}

/* =========================
   INIT
========================= */
carregarProdutos()
carregarPedidos()
iniciarPolling()