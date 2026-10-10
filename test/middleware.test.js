const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const request = require('supertest');
const app = require('../src/app');

function node(args, env) {
  return spawnSync(process.execPath, args, { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 20000 });
}

describe('R1: A custom logger middleware runs on every request', () => {
  it('src/middleware/logger.js logs "Middleware logger" and calls next', () => {
    const file = path.resolve('src/middleware/logger.js');
    assert.ok(fs.existsSync(file), 'Create src/middleware/logger.js');
    const logger = require(file);
    let called = false;
    const logs = [];
    const orig = console.log;
    console.log = (...a) => logs.push(a.join(' '));
    try { logger({}, {}, () => { called = true; }); } finally { console.log = orig; }
    assert.ok(logs.includes('Middleware logger'), 'logger should console.log "Middleware logger"');
    assert.ok(called, 'logger should call next()');
  });
  it('is used by the app', async (t) => {
    t.mock.method(console, 'log', () => {});
    await request(app).get('/api/genres');
    assert.ok(console.log.mock.calls.some((c) => c.arguments.join(' ') === 'Middleware logger'), 'The app should use the logger middleware (app.use(logger))');
  });
});

describe('R2: Genres can be created from form data', () => {
  it('POST /api/genres accepts application/x-www-form-urlencoded', async () => {
    const res = await request(app).post('/api/genres').type('form').send('name=Comedy');
    assert.ok([200, 201].includes(res.status), 'POST with form data should succeed (use express.urlencoded({ extended: true }))');
    assert.equal(res.body.name, 'Comedy');
  });
});

describe('R3: morgan logs only in development', () => {
  it('logs requests when NODE_ENV=development', () => {
    const r = node(['test/helpers/morgan-probe.js'], { NODE_ENV: 'development' });
    assert.match(r.stdout, /GET \/api\/genres 200/, 'With NODE_ENV=development, morgan("tiny") should log "GET /api/genres 200 ..."');
  });
  it('does not log when NODE_ENV=production', () => {
    const r = node(['test/helpers/morgan-probe.js'], { NODE_ENV: 'production' });
    assert.doesNotMatch(r.stdout, /GET \/api\/genres 200/, 'With NODE_ENV=production, morgan should not be used (check app.get("env"))');
  });
});

describe('R4: Static files are served from public/', () => {
  it('GET /public.txt returns the file', async () => {
    const res = await request(app).get('/public.txt');
    assert.equal(res.status, 200, 'GET /public.txt should return public/public.txt (use express.static)');
    assert.ok(res.text.trim().length > 0, 'public/public.txt should contain some text');
  });
});

describe('R5: Configuration comes from the config package', () => {
  const probe = "const c=require('config');console.log(JSON.stringify({name:c.get('name'),version:c.get('db.version'),password:c.has('db.password')?c.get('db.password'):null}))";
  const read = (env) => {
    const r = node(['-e', probe], env);
    try { return JSON.parse(r.stdout); } catch { return {}; }
  };
  it('development and production have their own db.version', () => {
    const dev = read({ NODE_ENV: 'development' });
    const prod = read({ NODE_ENV: 'production' });
    assert.ok(dev.name, 'config/default.json should define "name"');
    assert.equal(dev.version, 'development', 'config/development.json should set db.version to "development"');
    assert.equal(prod.version, 'production', 'config/production.json should set db.version to "production"');
  });
  it('the database password comes from an environment variable', () => {
    const out = read({ NODE_ENV: 'development', vivesbib_db_password: 's3cret' });
    assert.equal(out.password, 's3cret', 'config/custom-environment-variables.json should map db.password to "vivesbib_db_password"');
  });
});

describe('R6: The homepage is rendered with pug', () => {
  it('GET / returns HTML with a title and a welcome heading', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200, 'GET / should respond with 200');
    assert.match(res.text, /<title>[^<]+<\/title>/, 'The page should have a <title>');
    assert.match(res.text, /<h2>[^<]*Welcome[^<]*<\/h2>/, 'The page should contain an <h2> with "Welcome"');
  });
});

describe('R7: Routes live in src/routes', () => {
  it('home.js and genres.js export an Express router', () => {
    for (const f of ['home', 'genres']) {
      const file = path.resolve(`src/routes/${f}.js`);
      assert.ok(fs.existsSync(file), `Create src/routes/${f}.js`);
      const router = require(file);
      assert.equal(typeof router, 'function', `src/routes/${f}.js should export express.Router()`);
      assert.ok(Array.isArray(router.stack), `src/routes/${f}.js should export express.Router()`);
    }
  });
});
