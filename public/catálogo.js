async function carregarProdutos() {
    const resposta = await fetch('/produtos')
    const produtos = await resposta.json()
    const lista = document.getElementById('lista-produtos')

    produtos.forEach(produto => {
        const card = document.createElement('div')
        card.classList.add('card-produto')
        const porPeso = produto.unidade === 'grama'

        card.innerHTML = `
            ${produto.foto ? `<img src="/${produto.foto}" style="width:100%;border-radius:8px;margin-bottom:12px;object-fit:cover;height:180px;">` : ''}
            <h3>${produto.nome}</h3>
            <p>${produto.descricao}</p>
            <div class="preco">
                R$ ${parseFloat(produto.preco).toFixed(2)}
                <span style="font-size:0.75rem;color:#888;font-weight:normal">
                    ${porPeso ? '/ 100g' : '/ unidade'}
                </span>
            </div>

            ${porPeso ? `
            <!-- Produto vendido por peso -->
            <div class="controle-peso">
                <label style="font-size:0.85rem;color:#555;margin-bottom:4px;display:block">
                    ⚖️ Quantidade em gramas:
                </label>
                <div style="display:flex;align-items:center;gap:8px">
                    <button class="btn-qtd" onclick="mudarPeso(this, -50)">−50g</button>
                    <div style="display:flex;align-items:center;gap:4px;flex:1">
                        <input class="input-peso" type="number" value="100" min="50" step="50"
                            style="width:80px;padding:6px;border:2px solid #ddd;border-radius:6px;font-size:1rem;text-align:center">
                        <span style="color:#555;font-size:0.9rem">g</span>
                    </div>
                    <button class="btn-qtd" onclick="mudarPeso(this, 50)">+50g</button>
                </div>
                <p class="preco-peso" style="font-size:0.85rem;color:var(--dourado);margin-top:6px;font-weight:bold">
                    = R$ ${(parseFloat(produto.preco) * 100 / 100).toFixed(2)}
                </p>
            </div>
            ` : `
            <!-- Produto vendido por unidade -->
            <div class="controle-quantidade">
                <button class="btn-qtd" onclick="mudarQtd(this, -1)">−</button>
                <span class="qtd-valor">1</span>
                <button class="btn-qtd" onclick="mudarQtd(this, 1)">+</button>
            </div>
            `}

            <button onclick="adicionarAoCarrinho(${produto.id}, '${produto.nome}', ${produto.preco}, '${produto.unidade || 'unidade'}', this)">
                + Adicionar ao carrinho
            </button>
        `

        // Atualiza o preço ao vivo quando muda os gramas
        if (porPeso) {
            const inputPeso = card.querySelector('.input-peso')
            const precoPeso = card.querySelector('.preco-peso')
            inputPeso.addEventListener('input', () => {
                const g = parseInt(inputPeso.value) || 0
                const total = (parseFloat(produto.preco) * g / 100).toFixed(2)
                precoPeso.textContent = `= R$ ${total}`
            })
        }

        lista.appendChild(card)
    })
}

// ===== CONTROLES DE QUANTIDADE =====
function mudarQtd(btn, delta) {
    const span = btn.parentElement.querySelector('.qtd-valor')
    let val = parseInt(span.textContent) + delta
    if (val < 1) val = 1
    if (val > 99) val = 99
    span.textContent = val
}

function mudarPeso(btn, delta) {
    const input = btn.parentElement.querySelector('.input-peso')
    let val = parseInt(input.value) + delta
    if (val < 50) val = 50
    input.value = val
    input.dispatchEvent(new Event('input'))
}

// ===== CARRINHO =====
let carrinho = []
let painelAberto = false

function adicionarAoCarrinho(id, nome, preco, unidade, btnEl) {
    let quantidade, descQtd

    if (unidade === 'grama') {
        const input = btnEl.previousElementSibling.querySelector('.input-peso')
        quantidade = parseInt(input.value) || 100
        descQtd = quantidade + 'g'
    } else {
        const span = btnEl.previousElementSibling.querySelector('.qtd-valor')
        quantidade = parseInt(span.textContent)
        descQtd = quantidade + 'x'
    }

    // Preço total do item
    const precoTotal = unidade === 'grama'
        ? parseFloat(preco) * quantidade / 100
        : parseFloat(preco) * quantidade

    const existente = carrinho.find(i => i.produto_id === id && i.unidade === unidade)
    if (existente) {
        existente.quantidade += quantidade
        existente.precoTotal = parseFloat(preco) * existente.quantidade / (unidade === 'grama' ? 100 : 1)
    } else {
        carrinho.push({ produto_id: id, nome, preco, quantidade, unidade, precoTotal })
    }

    atualizarCarrinho()
    mostrarToast('✅ ' + descQtd + ' de ' + nome + ' adicionado!')
    abrirCarrinho()
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1)
    atualizarCarrinho()
    if (carrinho.length === 0) fecharCarrinho()
}

function mudarQtdCarrinho(index, delta) {
    const item = carrinho[index]
    const passo = item.unidade === 'grama' ? 50 : 1
    item.quantidade += delta * passo
    const minimo = item.unidade === 'grama' ? 50 : 1
    if (item.quantidade < minimo) {
        carrinho.splice(index, 1)
        if (carrinho.length === 0) fecharCarrinho()
    } else {
        item.precoTotal = item.unidade === 'grama'
            ? parseFloat(item.preco) * item.quantidade / 100
            : parseFloat(item.preco) * item.quantidade
    }
    atualizarCarrinho()
}

function atualizarCarrinho() {
    const itensDiv = document.getElementById('itens-carrinho')
    const totalEl = document.getElementById('carrinho-total')
    const footer = document.getElementById('carrinho-painel-footer')
    const vazio = document.getElementById('carrinho-vazio')
    const count = document.getElementById('carrinho-count')

    const total = carrinho.reduce((acc, item) => acc + item.precoTotal, 0)
    count.textContent = carrinho.length

    if (carrinho.length === 0) {
        itensDiv.innerHTML = ''
        vazio.style.display = 'block'
        footer.style.display = 'none'
    } else {
        vazio.style.display = 'none'
        footer.style.display = 'block'
        itensDiv.innerHTML = carrinho.map((item, index) => `
            <div class="item-carrinho">
                <div class="item-info">
                    <span class="item-nome">${item.nome}</span>
                    <span class="item-preco">R$ ${item.precoTotal.toFixed(2)}</span>
                </div>
                <div class="item-controles">
                    <button class="btn-qtd-carrinho" onclick="mudarQtdCarrinho(${index}, -1)">
                        ${item.unidade === 'grama' ? '−50g' : '−'}
                    </button>
                    <span>${item.unidade === 'grama' ? item.quantidade + 'g' : item.quantidade + 'x'}</span>
                    <button class="btn-qtd-carrinho" onclick="mudarQtdCarrinho(${index}, 1)">
                        ${item.unidade === 'grama' ? '+' : '+'}
                    </button>
                    <button class="btn-remover" onclick="removerDoCarrinho(${index})">🗑️</button>
                </div>
            </div>
        `).join('')
        totalEl.textContent = 'Total: R$ ' + total.toFixed(2)
    }
}

// ===== PAINEL =====
function toggleCarrinho() { painelAberto ? fecharCarrinho() : abrirCarrinho() }
function abrirCarrinho() { painelAberto = true; document.getElementById('carrinho-painel').classList.add('aberto') }
function fecharCarrinho() { painelAberto = false; document.getElementById('carrinho-painel').classList.remove('aberto') }

document.addEventListener('click', (e) => {
    const painel = document.getElementById('carrinho-painel')
    const btn = document.getElementById('carrinho-btn')
    if (painelAberto && !painel.contains(e.target) && !btn.contains(e.target)) fecharCarrinho()
})

function mostrarToast(msg) {
    const toast = document.getElementById('toast')
    toast.textContent = msg
    toast.classList.add('visivel')
    setTimeout(() => toast.classList.remove('visivel'), 2500)
}

document.getElementById('btn-finalizar').addEventListener('click', () => {
    if (carrinho.length === 0) { alert('Oxe, seu carrinho está vazio!'); return }
    // Manda pro checkout com quantidade em gramas para produtos de peso
    const itensParaSalvar = carrinho.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        unidade: item.unidade,
        nome: item.nome,
        preco: item.preco,
        precoTotal: item.precoTotal
    }))
    localStorage.setItem('carrinhoNutriVida', JSON.stringify(itensParaSalvar))
    window.location.href = '/checkout.html'
})

function login() { window.location.href = '/admin.html' }
function Voltar() { window.location.href = '/index.html' }

carregarProdutos()