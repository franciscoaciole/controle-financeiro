const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

async function register(req, res) {
  const { name, email, password } = req.body;

  // Validação básica: confere se os 3 campos vieram preenchidos
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    // Verifica se já existe um usuário com esse email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está cadastrado.' });
    }

    // Gera o hash da senha (nunca salvamos a senha original no banco!)
    const passwordHash = await bcrypt.hash(password, 10);

    // Cria o usuário no banco de dados
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // Retorna os dados do usuário, SEM a senha/hash
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
}
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    // Busca o usuário pelo email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    // Compara a senha enviada com o hash salvo no banco
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
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