const prisma = require('../lib/prisma');

const VALID_TYPES = ['INCOME', 'EXPENSE'];

function parseName(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > 40) return null;
  return text;
}

async function create(req, res) {
  const { name, type } = req.body;
  const userId = req.userId;

  const parsedName = parseName(name);

  if (!parsedName) {
    return res.status(400).json({ error: 'Informe um nome de até 40 caracteres.' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'O tipo deve ser INCOME ou EXPENSE.' });
  }

  try {
    const category = await prisma.category.create({
      data: { name: parsedName, type, userId },
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

  const data = {};

  if (name !== undefined) {
    const parsed = parseName(name);
    if (!parsed) {
      return res.status(400).json({ error: 'Informe um nome de até 40 caracteres.' });
    }
    data.name = parsed;
  }

  if (type !== undefined) {
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'O tipo deve ser INCOME ou EXPENSE.' });
    }
    data.type = type;
  }

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
      data,
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

    // Categoria em uso não pode ser apagada: as transações ficariam órfãs
    const inUse = await prisma.transaction.count({
      where: { categoryId: id, userId },
    });

    if (inUse > 0) {
      return res.status(409).json({
        error: 'Esta categoria tem transações. Mude ou exclua essas transações antes de apagá-la.',
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar categoria.' });
  }
}

module.exports = { create, list, update, remove };
