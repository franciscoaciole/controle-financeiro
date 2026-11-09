const express = require('express');
const { monthInsight } = require('../controllers/insightController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/month', monthInsight);

module.exports = router;
