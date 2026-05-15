// ===== RECUPERA O CARRINHO DO LOCALSTORAGE =====
const itensCarrinho = JSON.parse(localStorage.getItem('carrinhoNutriVida')) || []


// ===== VOLTAR PARA A LOJA =====
function voltarLoja() {
    window.location.href = '/index.html'
}


// ===== CONTROLA EXIBIÇÃO DE ENDEREÇO vs LOJA =====
function mudarEntrega() {
    const tipo = document.getElementById('tipo-entrega').value

    if (tipo === 'entrega') {
        document.getElementById('div-endereco').classList.remove('oculto')
        document.getElementById('div-loja').classList.add('oculto')
    } else if (tipo === 'retirada') {
        document.getElementById('div-endereco').classList.add('oculto')
        document.getElementById('div-loja').classList.remove('oculto')
    } else {
        document.getElementById('div-endereco').classList.add('oculto')
        document.getElementById('div-loja').classList.add('oculto')
    }

    // Recalcula maquineta e pix ao mudar entrega
    mudarPagamento()
}


// ===== CONTROLA EXIBIÇÃO DA MAQUINETA E DO PIX =====
function mudarPagamento() {
    const pag = document.getElementById('forma-pagamento').value
    const entrega = document.getElementById('tipo-entrega').value

    // Maquineta: só aparece se for cartão + entrega a domicílio
    if (pag === 'cartao' && entrega === 'entrega') {
        document.getElementById('div-maquineta').classList.remove('oculto')
    } else {
        document.getElementById('div-maquineta').classList.add('oculto')
    }

    // PIX: mostra bloco com QR code e chave quando selecionado
    if (pag === 'pix') {
        document.getElementById('div-pix').classList.remove('oculto')
    } else {
        document.getElementById('div-pix').classList.add('oculto')
    }
}


// ===== COPIAR CHAVE PIX =====
function copiarPix() {
    const chave = document.getElementById('chave-pix').value
    const msgEl = document.getElementById('msg-pix-copiado')

    // Tenta usar a API moderna do clipboard
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(chave).then(() => {
            msgEl.style.display = 'block'
            setTimeout(() => msgEl.style.display = 'none', 2500)
        }).catch(() => {
            copiarFallback(chave, msgEl)
        })
    } else {
        // Fallback para navegadores mais antigos ou HTTP
        copiarFallback(chave, msgEl)
    }
}

// Fallback de cópia via seleção de texto (funciona em HTTP também)
function copiarFallback(texto, msgEl) {
    const input = document.getElementById('chave-pix')
    input.select()
    input.setSelectionRange(0, 99999)
    try {
        document.execCommand('copy')
        msgEl.style.display = 'block'
        setTimeout(() => msgEl.style.display = 'none', 2500)
    } catch (e) {
        alert('Não foi possível copiar automaticamente. Copie manualmente: ' + texto)
    }
}


// ===== ENVIA O PEDIDO =====
async function enviarPedido() {
    const nome = document.getElementById('nome-cliente').value.trim()
    const telefone = document.getElementById('telefone-cliente').value.trim()
    const tipoEntrega = document.getElementById('tipo-entrega').value
    const pagamento = document.getElementById('forma-pagamento').value
    const maquineta = document.getElementById('precisa-maquineta').value

    const endereco = tipoEntrega === 'entrega'
        ? document.getElementById('endereco-cliente').value.trim()
        : 'Retirada na Loja'

    // ===== VALIDAÇÕES =====
    if (!nome) { alert('Por favor, preencha o seu nome.'); return }
    if (!telefone) { alert('Por favor, preencha o seu telefone.'); return }
    if (tipoEntrega === 'selecione') { alert('Por favor, selecione a forma de entrega.'); return }
    if (tipoEntrega === 'entrega' && !endereco) { alert('Por favor, preencha o seu endereço.'); return }
    if (pagamento === 'selecione') { alert('Por favor, selecione a forma de pagamento.'); return }
    if (itensCarrinho.length === 0) { alert('Seu carrinho está vazio!'); return }

    // Monta os itens no formato que o backend espera: { produto_id, quantidade }
    const itensMapeados = itensCarrinho.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade || 1
    }))

    const dadosPedido = {
        cliente_nome: nome,
        telefone: telefone,
        endereco: endereco,
        forma_pagamento: pagamento,
        precisa_maquineta: (pagamento === 'cartao' && tipoEntrega === 'entrega') ? maquineta : 'N/A',
        itens: itensMapeados
    }

    try {
        const resposta = await fetch('/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPedido)
        })

        const resultado = await resposta.json()

        if (resposta.ok) {
            localStorage.removeItem('carrinhoNutriVida')

            // Mensagem personalizada para PIX
            if (pagamento === 'pix') {
                alert('Pedido enviado! 🌿\n\nNão esqueça de realizar o pagamento via PIX para confirmar seu pedido.')
            } else {
                alert('Pedido realizado com sucesso! 🌿')
            }

            window.location.href = '/index.html'
        } else {
            alert('Erro ao enviar pedido: ' + resultado.erro)
        }
    } catch (erro) {
        alert('Erro de conexão com o servidor.')
        console.error(erro)
    }
}


// ===== INICIALIZAÇÃO =====
// Garante que os campos condicionais estejam no estado correto ao carregar
mudarEntrega()