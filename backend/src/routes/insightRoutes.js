const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { monthInsight } = require('../controllers/insightController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Cada resumo custa uma chamada paga à IA: no máximo 10 por hora por usuário.
// O limite usa o id do usuário (o authMiddleware já rodou), não o IP.
const insightLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.userId,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Limite de resumos atingido. Tente de novo em uma hora.' },
});

router.post('/month', insightLimiter, monthInsight);

module.exports = router;
