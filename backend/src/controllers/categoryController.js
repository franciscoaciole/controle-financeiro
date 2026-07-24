const prisma = require('../lib/prisma');

async function create(req, res) {
  const { name, type } = req.body;
  const userId = req.userId;

  if (!name || !type) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }

  try {
    const category = await prisma.category.create({
      data: { name, type, userId },
    });
    return res.status(201).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
}

async function list(req, res) {
  const userId = req.userId;

  try {
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
}

module.exports = { create, list };