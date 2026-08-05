require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// Middlewares globais
app.use(cors()); // por enquanto libera geral; ajustamos para restringir depois do deploy do frontend
app.use(express.json());

// Rotas
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/transactions', transactionRoutes);

// Rota de teste simples
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});