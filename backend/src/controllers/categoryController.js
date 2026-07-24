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
async function update(req, res) {
  const { id } = req.params;
  const { name, type } = req.body;
  const userId = req.userId;

  try {
    // Confere se a categoria existe E pertence a esse usuário
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, type },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
}

async function remove(req, res) {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    await prisma.category.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar categoria.' });
  }
}

module.exports = { create, list, update, remove};