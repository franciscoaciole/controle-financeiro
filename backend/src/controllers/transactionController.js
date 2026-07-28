const prisma = require('../lib/prisma');

async function create(req, res) {
  const { description, amount, date, categoryId } = req.body;
  const userId = req.userId;

  if (!description || !amount || !date || !categoryId) {
    return res.status(400).json({ error: 'Descrição, valor, data e categoria são obrigatórios.' });
  }

  try {
    // Confere se a categoria existe E pertence a esse usuário
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount,
        date: new Date(date),
        userId,
        categoryId,
      },
    });

    return res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar transação.' });
  }
}

async function list(req, res) {
  const userId = req.userId;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true }, // já traz os dados da categoria junto
      orderBy: { date: 'desc' },
    });
    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao listar transações.' });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { description, amount, date, categoryId } = req.body;
  const userId = req.userId;

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount,
        date: date ? new Date(date) : undefined,
        categoryId,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar transação.' });
  }
}

async function remove(req, res) {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    await prisma.transaction.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar transação.' });
  }
}

module.exports = { create, list, update, remove };