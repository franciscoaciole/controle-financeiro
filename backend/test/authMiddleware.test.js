const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middlewares/authMiddleware');

const secret = 'test-secret-that-is-long-enough-for-hmac';

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

test('authMiddleware accepts a valid HS256 token', () => {
  process.env.JWT_SECRET = secret;
  const req = {
    headers: {
      authorization: `Bearer ${jwt.sign({ userId: 'user-1' }, secret, {
        algorithm: 'HS256',
      })}`,
    },
  };
  const res = fakeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.userId, 'user-1');
});

test('authMiddleware rejects a token signed with a different algorithm', () => {
  process.env.JWT_SECRET = secret;
  const req = {
    headers: {
      authorization: `Bearer ${jwt.sign({ userId: 'user-1' }, secret, {
        algorithm: 'HS384',
      })}`,
    },
  };
  const res = fakeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Token inválido ou expirado.' });
});
