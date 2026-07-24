const express = require('express');
const { create, list } = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware); // protege TODAS as rotas abaixo

router.post('/', create);
router.get('/', list);

module.exports = router;