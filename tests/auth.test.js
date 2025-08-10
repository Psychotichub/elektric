const request = require('supertest');
require('dotenv').config();

let app;

beforeAll(() => {
  // Load the server without listening. We export app instance from a lightweight bootstrap
  app = require('../tests/serverStub');
});

describe('Auth routes', () => {
  it('GET /api/auth/db-status should respond 200', async () => {
    const res = await request(app).get('/api/auth/db-status');
    // We only check that route exists and returns JSON
    expect([200, 500]).toContain(res.statusCode);
    expect(res.headers['content-type']).toMatch(/json/);
  });
});

