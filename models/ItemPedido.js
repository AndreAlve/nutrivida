const mongoose = require('mongoose')

const ItemPedidoSchema = new mongoose.Schema({
  pedido_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido'
  },
  produto_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto'
  },
  quantidade: {
    type: Number,
    default: 1
  }
})

module.exports = mongoose.model('ItemPedido', ItemPedidoSchema, 'itempedidos')