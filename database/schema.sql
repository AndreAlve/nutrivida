CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    estoque INT DEFAULT 0,
    foto VARCHAR(255),
    unidade VARCHAR(10) DEFAULT 'unidade'
);

CREATE TABLE pedido (
    id SERIAL PRIMARY KEY,
    cliente_nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT,
    forma_pagamento VARCHAR(30),
    precisa_maquineta VARCHAR(10),
    status_pedido VARCHAR(20) DEFAULT 'pendente',
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    produto_id INT NOT NULL REFERENCES produto(id),
    quantidade INT NOT NULL DEFAULT 1
);