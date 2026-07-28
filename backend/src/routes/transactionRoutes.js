const express = require('express');
const { create, list, update, remove, summary } = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/summary', summary); // essa linha vem ANTES da rota com /:id
router.post('/', create);
router.get('/', list);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;