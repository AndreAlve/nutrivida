// CORREÇÃO: antes Login() só redirecionava direto para /painel.html
// sem verificar nada — qualquer um entrava no painel
// Agora chama a rota POST /admin/login antes de liberar o acesso
async function Login() {
    const usuario = document.getElementById('usuario').value
    const senha = document.getElementById('senha').value
    const erroEl = document.getElementById('erro-login')

    erroEl.textContent = ''

    if (!usuario || !senha) {
        erroEl.textContent = 'Preencha usuário e senha.'
        return
    }

    try {
        const resposta = await fetch('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        })

        const dados = await resposta.json()

        if (dados.sucesso) {
            localStorage.setItem('adminLogado', 'true')
            window.location.href = '/painel.html'
        } else {
            erroEl.textContent = dados.mensagem || 'Usuário ou senha incorretos.'
        }
    } catch (erro) {
        erroEl.textContent = 'Erro de conexão com o servidor.'
        console.error(erro)
    }
}
// ===== VOLTAR =====
function Voltar() {
    localStorage.removeItem('adminLogado')
    window.location.href = '/index.html'
}
