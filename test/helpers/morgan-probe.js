// Spawned by the tests with a given NODE_ENV: makes one request and exits.
const request = require('supertest');
const app = require('../../src/app');
request(app).get('/api/genres').then(() => process.exit(0));
