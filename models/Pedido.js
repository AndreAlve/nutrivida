const mongoose = require('mongoose')

const PedidoSchema = new mongoose.Schema({
  cliente_nome: { type: String, required: true },
  telefone: { type: String, required: true },
  endereco: String,
  forma_pagamento: String,
  precisa_maquineta: Boolean,
  status_pedido: {
    type: String,
    default: 'pendente'
  },
  data_pedido: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Pedido', PedidoSchema, 'pedidos')