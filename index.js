require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const path = require('path')
const cors = require('cors')

const { v2: cloudinary } = require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const Produto = require('./models/Produto')
const Pedido = require('./models/Pedido')
const ItemPedido = require('./models/ItemPedido')

const app = express()

// =========================
// MIDDLEWARES
// =========================
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))


// =========================
// MONGODB
// =========================
console.log(
  "Mongo URI:",
  process.env.MONGO_URI ? "OK" : "UNDEFINED"
)

mongoose.connect(process.env.MONGO_URI, {
  dbName: 'nutrivida'
})
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ Erro Mongo:', err))


// =========================
// CLOUDINARY
// =========================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nutrivida',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
})

const upload = multer({ storage })


// =========================
// LOGIN
// =========================
app.post('/admin/login', (req, res) => {
  try {
    const { usuario, senha } = req.body

    const usuarioCorreto =
      process.env.ADMIN_USUARIO || 'nutrivida'

    const senhaCorreta =
      process.env.ADMIN_SENHA || 'nutrivida123'

    if (
      usuario === usuarioCorreto &&
      senha === senhaCorreta
    ) {
      return res.json({
        sucesso: true,
        mensagem: 'Login realizado'
      })
    }

    return res.status(401).json({
      sucesso: false,
      mensagem: 'Usuário ou senha incorretos'
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: err.message })
  }
})


// =========================
// PRODUTOS
// =========================
app.get('/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find()
    res.json(produtos)

  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: err.message })
  }
})

app.post('/produtos',
  upload.single('foto'),
  async (req, res) => {
    try {
      const foto = req.file
        ? req.file.path
        : null

      const produto = await Produto.create({
        ...req.body,
        foto
      })

      res.status(201).json(produto)

    } catch (err) {
      console.error(err)
      res.status(500).json({ erro: err.message })
    }
})

app.put('/produtos/:id',
  upload.single('foto'),
  async (req, res) => {
    try {
      const dados = { ...req.body }

      if (req.file) {
        dados.foto = req.file.path
      }

      await Produto.findByIdAndUpdate(
        req.params.id,
        dados
      )

      res.json({
        mensagem: 'Produto atualizado'
      })

    } catch (err) {
      console.error(err)
      res.status(500).json({ erro: err.message })
    }
})

app.delete('/produtos/:id', async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id)

    res.json({
      mensagem: 'Produto removido'
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: err.message })
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

    if (!itens || itens.length === 0) {
      return res.status(400).json({
        erro: 'Nenhum item enviado'
      })
    }

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
        quantidade: item.quantidade || 1
      })
    }

    res.status(201).json({
      mensagem: 'Pedido criado',
      pedido_id: pedido._id
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: err.message })
  }
})

app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .sort({ data_pedido: -1 })

    res.json(pedidos)

  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: err.message })
  }
})

app.get('/pedidos/:id/itens', async (req, res) => {
  try {
    const itens = await ItemPedido.find({
      pedido_id: req.params.id
    }).populate('produto_id')

    res.json(itens)

  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: err.message })
  }
})

app.put('/pedidos/:id/status', async (req, res) => {
  try {
    await Pedido.findByIdAndUpdate(
      req.params.id,
      { status_pedido: req.body.status }
    )

    res.json({
      mensagem: 'Status atualizado'
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: err.message })
  }
})

app.delete('/pedidos/:id', async (req, res) => {
  try {
    await ItemPedido.deleteMany({
      pedido_id: req.params.id
    })

    await Pedido.findByIdAndDelete(req.params.id)

    res.json({
      mensagem: 'Pedido removido'
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: err.message })
  }
})


// =========================
// HOME
// =========================
app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'public', 'index.html')
  )
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})

module.exports = app