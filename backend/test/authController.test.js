const test = require('node:test');
const assert = require('node:assert/strict');

let existingUser = null;
let transactionError = null;
let createdUser;

const fakePrisma = {
  user: {
    findFirst: async () => existingUser,
  },
  $transaction: async (callback) => {
    if (transactionError) throw transactionError;

    return callback({
      user: {
        create: async ({ data }) => {
          createdUser = { id: 'new-user', ...data };
          return createdUser;
        },
      },
      category: {
        createMany: async () => ({ count: 7 }),
      },
    });
  },
};

const prismaPath = require.resolve('../src/lib/prisma');
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: fakePrisma,
};

const { register } = require('../src/controllers/authController');

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function registerRequest() {
  const res = fakeRes();
  await register({
    body: {
      name: 'Maria',
      email: 'maria@example.com',
      password: 'senha-segura-123',
    },
  }, res);
  return res;
}

test('register returns the same generic response for new and existing emails', async () => {
  transactionError = null;
  existingUser = null;
  createdUser = null;
  const newRegistration = await registerRequest();
  assert.equal(createdUser.id, 'new-user');

  existingUser = { id: 'existing-user' };
  const duplicateRegistration = await registerRequest();

  assert.equal(duplicateRegistration.statusCode, newRegistration.statusCode);
  assert.deepEqual(duplicateRegistration.body, newRegistration.body);
  assert.deepEqual(newRegistration.body, {
    message: 'Solicitação processada. Tente entrar para continuar.',
  });
});

test('register returns the same generic response for a concurrent duplicate', async () => {
  existingUser = null;
  transactionError = { code: 'P2002' };

  const res = await registerRequest();

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    message: 'Solicitação processada. Tente entrar para continuar.',
  });

  transactionError = null;
});
