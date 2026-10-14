require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const prisma = require('./lib/prisma');

const app = express();

// Middlewares globais
const allowedOrigins = [
  'https://meufinanmais.vercel.app',
  'http://localhost:5173',
];
if (process.env.LOCAL_ORIGIN) allowedOrigins.push(process.env.LOCAL_ORIGIN);

app.use(cors({
  origin: function (origin, callback) {
    // permite requisições sem "origin" (ex: Postman, curl) e as da lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
}));
app.use(express.json());

// Rotas
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/transactions', transactionRoutes);

// Rota leve só para manter o servidor acordado (não toca no banco)
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Rota de teste simples
app.get('/health', async (req, res) => {
  try {
    // faz uma consulta simples pra manter o banco (Supabase) ativo
    await prisma.user.count();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Erro ao consultar banco no /health:', error);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});