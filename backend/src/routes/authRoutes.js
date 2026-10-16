const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Login: 10 tentativas ERRADAS por IP a cada 15 minutos.
// Logins bem-sucedidos não contam.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos e tente de novo.' },
});

// Cadastro: 10 contas por IP a cada hora.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitos cadastros a partir desta rede. Tente novamente mais tarde.' },
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);

module.exports = router;
