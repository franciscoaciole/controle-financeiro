const prisma = require('../lib/prisma');
const defaultCategories = require('../lib/defaultCategories');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { parseRegister, MAX_PASSWORD } = require('../lib/validators');

// Hash falso, usado quando o email não existe: assim o login leva o mesmo
// tempo nos dois casos e ninguém descobre quais emails têm conta
const DUMMY_HASH = bcrypt.hashSync('senha-falsa-para-comparacao', 10);
const REGISTER_RESPONSE = Object.freeze({
  message: 'Solicitação processada. Tente entrar para continuar.',
});

async function register(req, res) {
  const parsed = parseRegister(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }
  const { name, email, password } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    // Verifica se já existe um usuário com esse email (sem diferenciar maiúsculas)
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existingUser) {
      return res.status(200).json(REGISTER_RESPONSE);
    }

    // Cria o usuário e as categorias padrão juntos:
    // se uma das duas falhar, nenhuma é salva
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash },
      });

      await tx.category.createMany({
        data: defaultCategories.map((cat) => ({
          ...cat,
          userId: newUser.id,
        })),
      });
    });

    return res.status(200).json(REGISTER_RESPONSE);
  } catch (error) {
    // Dois cadastros simultâneos com o mesmo email: o banco recusa o segundo
    if (error.code === 'P2002') {
      return res.status(200).json(REGISTER_RESPONSE);
    }
    console.error(error);
    return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  // Valores absurdos nunca são credenciais válidas
  if (email.length > 254 || password.length > MAX_PASSWORD) {
    return res.status(401).json({ error: 'Email ou senha inválidos.' });
  }

  try {
    // Busca o usuário pelo email (sem diferenciar maiúsculas)
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });

    // Compara sempre, mesmo sem usuário, pra o tempo de resposta ser igual
    const passwordMatches = await bcrypt.compare(
      password,
      user ? user.passwordHash : DUMMY_HASH
    );

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao fazer login.' });
  }
}

module.exports = { register, login };
