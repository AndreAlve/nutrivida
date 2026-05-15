async function carregarProdutos() {
    try {
        const resposta = await fetch('/produtos')
        const produtos = await resposta.json()
        const lista = document.getElementById('lista-produtos')

        lista.innerHTML = ''

        produtos.forEach(produto => {
            const card = document.createElement('div')
            card.classList.add('card-produto')

            const porPeso = produto.unidade === 'grama'

            // Corrige URL da imagem
            const foto = produto.foto
                ? produto.foto.startsWith('http')
                    ? produto.foto
                    : `/${produto.foto}`
                : null

            card.innerHTML = `
                ${foto ? `
                    <img 
                        src="${foto}" 
                        style="
                            width:100%;
                            height:180px;
                            object-fit:cover;
                            border-radius:8px;
                            margin-bottom:12px;
                        "
                    >
                ` : ''}

                <h3>${produto.nome}</h3>
                <p>${produto.descricao}</p>

                <div class="preco">
                    R$ ${parseFloat(produto.preco).toFixed(2)}
                    <span style="
                        font-size:0.75rem;
                        color:#888;
                        font-weight:normal
                    ">
                        ${porPeso ? '/ 100g' : '/ unidade'}
                    </span>
                </div>

                ${porPeso ? `
                <div class="controle-peso">
                    <label style="
                        font-size:0.85rem;
                        color:#555;
                        margin-bottom:4px;
                        display:block
                    ">
                        ⚖️ Quantidade em gramas:
                    </label>

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:8px
                    ">
                        <button class="btn-qtd"
                            onclick="mudarPeso(this, -50)">
                            −50g
                        </button>

                        <div style="
                            display:flex;
                            align-items:center;
                            gap:4px;
                            flex:1
                        ">
                            <input
                                class="input-peso"
                                type="number"
                                value="100"
                                min="50"
                                step="50"
                                style="
                                    width:80px;
                                    padding:6px;
                                    border:2px solid #ddd;
                                    border-radius:6px;
                                    text-align:center
                                "
                            >
                            <span>g</span>
                        </div>

                        <button class="btn-qtd"
                            onclick="mudarPeso(this, 50)">
                            +50g
                        </button>
                    </div>

                    <p class="preco-peso"
                        style="
                            color:var(--dourado);
                            margin-top:6px;
                            font-weight:bold
                        ">
                        = R$ ${parseFloat(produto.preco).toFixed(2)}
                    </p>
                </div>
                ` : `
                <div class="controle-quantidade">
                    <button class="btn-qtd"
                        onclick="mudarQtd(this, -1)">
                        −
                    </button>

                    <span class="qtd-valor">1</span>

                    <button class="btn-qtd"
                        onclick="mudarQtd(this, 1)">
                        +
                    </button>
                </div>
                `}

                <button onclick="
                    adicionarAoCarrinho(
                        '${produto._id}',
                        '${produto.nome}',
                        ${produto.preco},
                        '${produto.unidade || 'unidade'}',
                        this
                    )
                ">
                    + Adicionar ao carrinho
                </button>
            `

            if (porPeso) {
                const inputPeso =
                    card.querySelector('.input-peso')

                const precoPeso =
                    card.querySelector('.preco-peso')

                inputPeso.addEventListener('input', () => {
                    const g =
                        parseInt(inputPeso.value) || 0

                    const total =
                        (parseFloat(produto.preco) * g / 100)
                        .toFixed(2)

                    precoPeso.textContent =
                        `= R$ ${total}`
                })
            }

            lista.appendChild(card)
        })

    } catch (err) {
        console.error('Erro ao carregar produtos:', err)
    }
}
function login() {
    window.location.href = '/admin.html'
}

function Voltar() {
    window.location.href = '/index.html'
}