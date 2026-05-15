const mongoose = require('mongoose')

const ProdutoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  preco: { type: Number, required: true },
  descricao: String,
  estoque: Number,
  foto: String,
  unidade: {
    type: String,
    default: 'unidade'
  }
})

module.exports = mongoose.model('Produto', ProdutoSchema, 'produtos')