require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const path = require('path')
const cors = require('cors')
const fs = require('fs')

const Produto = require('./models/Produto')
const Pedido = require('./models/Pedido')
const ItemPedido = require('./models/ItemPedido')

const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static('public'))

fs.mkdirSync('public/uploads', { recursive: true })

// ===== MongoDB =====
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ Erro Mongo:', err))

// ===== Upload =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

// ===== LOGIN =====
app.post('/admin/login', (req, res) => {
  const { usuario, senha } = req.body

  const usuarioCorreto = process.env.ADMIN_USUARIO || 'nutrivida'
  const senhaCorreta = process.env.ADMIN_SENHA || 'nutrivida123'

  if (usuario === usuarioCorreto && senha === senhaCorreta) {
    return res.json({ sucesso: true })
  }

  res.status(401).json({
    sucesso: false,
    mensagem: 'Usuário ou senha incorretos'
  })
})


// =========================
// PRODUTOS
// =========================

app.get('/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find()
    res.json(produtos)
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar produtos' })
  }
})

app.post('/produtos', upload.single('foto'), async (req, res) => {
  try {
    const foto = req.file ? 'uploads/' + req.file.filename : null

    const produto = await Produto.create({
      ...req.body,
      foto
    })

    res.json(produto)
  } catch {
    res.status(500).json({ erro: 'Erro ao criar produto' })
  }
})

app.put('/produtos/:id', upload.single('foto'), async (req, res) => {
  try {
    const dados = { ...req.body }

    if (req.file) {
      dados.foto = 'uploads/' + req.file.filename
    }

    await Produto.findByIdAndUpdate(req.params.id, dados)

    res.json({ mensagem: 'Produto atualizado' })
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar' })
  }
})

app.delete('/produtos/:id', async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id)
    res.json({ mensagem: 'Produto removido' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover' })
  }
})


// =========================
// PEDIDOS
// =========================

app.post('/pedidos', async (req, res) => {
  try {
    const {
      cliente_nome,
      telefone,
      endereco,
      forma_pagamento,
      precisa_maquineta,
      itens
    } = req.body

    const pedido = await Pedido.create({
      cliente_nome,
      telefone,
      endereco,
      forma_pagamento,
      precisa_maquineta
    })

    for (const item of itens) {
      await ItemPedido.create({
        pedido_id: pedido._id,
        produto_id: item.produto_id,
        quantidade: item.quantidade
      })
    }

    res.status(201).json({
      mensagem: 'Pedido criado',
      pedido_id: pedido._id
    })

  } catch (err) {
    console.log(err)
    res.status(500).json({ erro: 'Erro ao criar pedido' })
  }
})

app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .sort({ data_pedido: -1 })

    res.json(pedidos)
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar pedidos' })
  }
})

app.get('/pedidos/:id/itens', async (req, res) => {
  try {
    const itens = await ItemPedido.find({
      pedido_id: req.params.id
    }).populate('produto_id')

    res.json(itens)
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar itens' })
  }
})

app.put('/pedidos/:id/status', async (req, res) => {
  try {
    await Pedido.findByIdAndUpdate(
      req.params.id,
      { status_pedido: req.body.status }
    )

    res.json({ mensagem: 'Status atualizado' })
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar' })
  }
})

app.delete('/pedidos/:id', async (req, res) => {
  try {
    await ItemPedido.deleteMany({
      pedido_id: req.params.id
    })

    await Pedido.findByIdAndDelete(req.params.id)

    res.json({ mensagem: 'Pedido removido' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover pedido' })
  }
})


// ===== HOME =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

module.exports = app