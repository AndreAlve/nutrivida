async function carregarProdutos() {
    try {
        console.log("Buscando produtos...")

        const resposta = await fetch('http://localhost:3000/produtos')

        if (!resposta.ok) {
            throw new Error("Erro na API")
        }

        const produtos = await resposta.json()

        console.log("Produtos recebidos:", produtos)

        const lista = document.getElementById('lista-produtos')

        if (!lista) {
            console.error("Div lista-produtos não encontrada")
            return
        }

        lista.innerHTML = ''

        if (produtos.length === 0) {
            lista.innerHTML = "<p>Nenhum produto cadastrado.</p>"
            return
        }

        produtos.forEach(produto => {
            const card = document.createElement('div')
            card.className = "card-produto"

            const foto = produto.foto || ''

            card.innerHTML = `
                <img src="${foto}" 
                     style="width:100%;height:180px;object-fit:cover;border-radius:8px">

                <h3>${produto.nome}</h3>
                <p>${produto.descricao}</p>
                <h2>R$ ${Number(produto.preco).toFixed(2)}</h2>

                <button onclick="adicionarAoCarrinho(
                    '${produto._id}',
                    '${produto.nome}',
                    ${produto.preco},
                    '${produto.unidade}'
                )">
                    Adicionar
                </button>
            `

            lista.appendChild(card)
        })

    } catch (erro) {
        console.error("Erro:", erro)
    }
}

carregarProdutos()

// ===== CARRINHO =====
let carrinho = JSON.parse(localStorage.getItem('carrinhoNutriVida')) || []

function adicionarAoCarrinho(id, nome, preco, unidade) {
    const existente = carrinho.find(item => item.produto_id === id)

    if (existente) {
        existente.quantidade += 1
        existente.precoTotal =
            existente.quantidade * parseFloat(preco)
    } else {
        carrinho.push({
            produto_id: id,
            nome: nome,
            preco: parseFloat(preco),
            quantidade: 1,
            unidade: unidade,
            precoTotal: parseFloat(preco)
        })
    }

    localStorage.setItem(
        'carrinhoNutriVida',
        JSON.stringify(carrinho)
    )

    alert(`✅ ${nome} adicionado ao carrinho`)
}

function login() {
    window.location.href = "/admin.html"
}

function Voltar() {
    window.location.href = "/index.html"
}