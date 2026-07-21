require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

// Middlewares globais
app.use(cors());           // permite o frontend acessar essa API
app.use(express.json());   // permite o servidor entender JSON no corpo das requisições

// Rotas
app.use('/auth', authRoutes);

// Rota de teste simples
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});