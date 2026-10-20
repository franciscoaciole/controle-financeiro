const prisma = require('../lib/prisma');
const { parseDescription, parseAmount, parseDate } = require('../lib/validators');

async function create(req, res) {
  const { description, amount, date, categoryId } = req.body;
  const userId = req.userId;

  const parsedDescription = parseDescription(description);
  const parsedAmount = parseAmount(amount);
  const parsedDate = parseDate(date);

  if (!parsedDescription) {
    return res.status(400).json({ error: 'Informe uma descrição de até 100 caracteres.' });
  }
  if (parsedAmount === null) {
    return res.status(400).json({ error: 'O valor deve ser um número maior que zero.' });
  }
  if (!parsedDate) {
    return res.status(400).json({ error: 'Data inválida.' });
  }
  if (typeof categoryId !== 'string' || !categoryId) {
    return res.status(400).json({ error: 'Categoria é obrigatória.' });
  }

  try {
    // categoria existe E pertence ao usuário
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        description: parsedDescription,
        amount: parsedAmount,
        date: parsedDate,
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

async function summary(req, res) {
  const userId = req.userId;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'asc' },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const dailyMap = {};

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);
      const dateKey = transaction.date.toISOString().split('T')[0];

      if (transaction.category.type === 'INCOME') {
        totalIncome += amount;
      } else if (transaction.category.type === 'EXPENSE') {
        totalExpense += amount;
      }

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, net: 0 };
      }

      dailyMap[dateKey].net +=
        transaction.category.type === 'INCOME' ? amount : -amount;
    }

    const balance = totalIncome - totalExpense;

    // Transforma o mapa em array ordenado e calcula o saldo acumulado
    const sortedDays = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    let running = 0;
    const dailyData = sortedDays.map((day) => {
      running += day.net;
      return { date: day.date, balance: running };
    });

    return res.status(200).json({
      totalIncome,
      totalExpense,
      balance,
      dailyData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao calcular resumo.' });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { description, amount, date, categoryId } = req.body;
  const userId = req.userId;

  // Valida só o que foi enviado; o que não veio fica como está
  const data = {};

  if (description !== undefined) {
    const parsed = parseDescription(description);
    if (!parsed) {
      return res.status(400).json({ error: 'Informe uma descrição de até 100 caracteres.' });
    }
    data.description = parsed;
  }

  if (amount !== undefined) {
    const parsed = parseAmount(amount);
    if (parsed === null) {
      return res.status(400).json({ error: 'O valor deve ser um número maior que zero.' });
    }
    data.amount = parsed;
  }

  if (date !== undefined) {
    const parsed = parseDate(date);
    if (!parsed) {
      return res.status(400).json({ error: 'Data inválida.' });
    }
    data.date = parsed;
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    if (categoryId !== undefined) {
      if (typeof categoryId !== 'string' || !categoryId) {
        return res.status(400).json({ error: 'Categoria inválida.' });
      }
      // a nova categoria também precisa existir e ser do mesmo usuário
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada.' });
      }
      data.categoryId = categoryId;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
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

module.exports = { create, list, update, remove, summary };
