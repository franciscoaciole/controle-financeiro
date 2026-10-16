require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const prisma = require('./lib/prisma');

// Sem a chave dos tokens o login nem funciona: melhor falhar já na partida
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não está definida. Encerrando.');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn('AVISO: JWT_SECRET tem menos de 32 caracteres. Use uma chave mais longa e aleatória.');
}

const app = express();

// O Render fica na frente do servidor (proxy): sem isso, todo mundo
// pareceria ter o mesmo IP e o limite de tentativas valeria pra todos juntos
app.set('trust proxy', 1);

// Cabeçalhos de segurança. A política "cross-origin" é necessária porque
// o frontend (Vercel) e a API (Render) ficam em domínios diferentes
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  'https://meufinanmais.vercel.app',
  'http://localhost:5173',
];
if (process.env.LOCAL_ORIGIN) allowedOrigins.push(process.env.LOCAL_ORIGIN);

app.use(cors({
  origin: function (origin, callback) {
    // permite requisições sem "origin" (ex: Postman, curl) e as da lista
    callback(null, !origin || allowedOrigins.includes(origin));
  },
}));

// Corpo das requisições limitado a 10 KB: o app nunca precisa de mais
app.use(express.json({ limit: '10kb' }));

// Limite geral das rotas de dados: 300 requisições por IP a cada 15 minutos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde alguns minutos.' },
});

// Rotas
app.use('/auth', authRoutes);
app.use('/categories', apiLimiter, categoryRoutes);
app.use('/transactions', apiLimiter, transactionRoutes);

// Rota leve só para manter o servidor acordado (não toca no banco)
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Rota de teste simples
app.get('/health', async (req, res) => {
  try {
    // faz uma consulta simples pra manter o banco ativo
    await prisma.user.count();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Erro ao consultar banco no /health:', error);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Erros de requisição (JSON quebrado ou grande demais) viram respostas claras
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Requisição grande demais.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido.' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
