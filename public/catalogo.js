// ===== PRODUTOS =====
async function carregarProdutos() {
    try {
        const resposta = await fetch('http://localhost:3000/produtos')
        if (!resposta.ok) throw new Error("Erro na API")

        const produtos = await resposta.json()
        const lista = document.getElementById('lista-produtos')
        if (!lista) return

        lista.innerHTML = ''

        if (produtos.length === 0) {
            lista.innerHTML = "<p>Nenhum produto cadastrado.</p>"
            return
        }

        produtos.forEach(produto => {
            const card = document.createElement('div')
            card.className = "card-produto"

            // ⚠️ Usar data-attributes evita quebrar com apóstrofes no nome
            card.innerHTML = `
                <img src="${produto.foto || ''}"
                     style="width:100%;height:180px;object-fit:cover;border-radius:8px">
                <h3>${produto.nome}</h3>
                <p>${produto.descricao}</p>
                <h2>R$ ${Number(produto.preco).toFixed(2)}</h2>
                <button
                    class="btn-adicionar"
                    data-id="${produto._id}"
                    data-nome="${produto.nome}"
                    data-preco="${produto.preco}"
                    data-unidade="${produto.unidade || ''}">
                    Adicionar
                </button>
            `
            lista.appendChild(card)
        })

        // delegação de evento — sem risco de apóstrofe quebrar o onclick
        lista.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-adicionar')
            if (!btn) return
            adicionarAoCarrinho(
                btn.dataset.id,
                btn.dataset.nome,
                btn.dataset.preco,
                btn.dataset.unidade
            )
        })

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro)
    }
}

carregarProdutos()


// ===== CARRINHO (estado) =====
let carrinho = JSON.parse(localStorage.getItem('carrinhoNutriVida')) || []

function salvarCarrinho() {
    localStorage.setItem('carrinhoNutriVida', JSON.stringify(carrinho))
}


// ===== ADICIONAR =====
function adicionarAoCarrinho(id, nome, preco, unidade) {
    const existente = carrinho.find(item => item.produto_id === id)

    if (existente) {
        existente.quantidade += 1
        existente.precoTotal = existente.quantidade * parseFloat(preco)
    } else {
        carrinho.push({
            produto_id: id,
            nome,
            preco: parseFloat(preco),
            quantidade: 1,
            unidade,
            precoTotal: parseFloat(preco)
        })
    }

    salvarCarrinho()
    renderizarCarrinho()   // ← atualiza o painel
    mostrarToast(`✅ ${nome} adicionado!`)
}


// ===== REMOVER =====
function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.produto_id !== id)
    salvarCarrinho()
    renderizarCarrinho()
}


// ===== RENDERIZAR PAINEL =====
function renderizarCarrinho() {
    const itensDiv     = document.getElementById('itens-carrinho')
    const vazioDiv     = document.getElementById('carrinho-vazio')
    const footerDiv    = document.getElementById('carrinho-painel-footer')
    const totalP       = document.getElementById('carrinho-total')
    const countSpan    = document.getElementById('carrinho-count')

    // contador no botão flutuante
    const total = carrinho.reduce((s, i) => s + i.quantidade, 0)
    countSpan.textContent = total

    if (carrinho.length === 0) {
        itensDiv.innerHTML = ''
        vazioDiv.style.display  = 'block'
        footerDiv.style.display = 'none'
        return
    }

    vazioDiv.style.display  = 'none'
    footerDiv.style.display = 'block'

    // monta a lista de itens
    itensDiv.innerHTML = carrinho.map(item => `
        <div class="carrinho-item">
            <div class="carrinho-item-info">
                <strong>${item.nome}</strong>
                <small>${item.quantidade} ${item.unidade || 'un'} × R$ ${item.preco.toFixed(2)}</small>
            </div>
            <div class="carrinho-item-acoes">
                <span>R$ ${item.precoTotal.toFixed(2)}</span>
                <button onclick="removerDoCarrinho('${item.produto_id}')" title="Remover">🗑</button>
            </div>
        </div>
    `).join('')

    // total geral
    const valorTotal = carrinho.reduce((s, i) => s + i.precoTotal, 0)
    totalP.textContent = `Total: R$ ${valorTotal.toFixed(2)}`
}


// ===== ABRIR / FECHAR PAINEL =====
function toggleCarrinho() {
    const painel = document.getElementById('carrinho-painel')
    const aberto = painel.classList.toggle('aberto')
    if (aberto) renderizarCarrinho()
}

function fecharCarrinho() {
    document.getElementById('carrinho-painel').classList.remove('aberto')
}


// ===== TOAST =====
function mostrarToast(msg) {
    const toast = document.getElementById('toast')
    toast.textContent = msg
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 2500)
}


// ===== FINALIZAR PEDIDO =====
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-finalizar')
        ?.addEventListener('click', finalizarPedido)

    renderizarCarrinho() // já mostra o contador ao abrir a página
})

function finalizarPedido() {
    if (!carrinho.length) {
        mostrarToast('Seu carrinho está vazio 🌿')
        return
    }
    salvarCarrinho()
    window.location.href = '/checkout.html'
}


// ===== NAV =====
function login()  { window.location.href = "/admin.html" }
function Voltar() { window.location.href = "/index.html" }