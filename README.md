# Lab 05: Middleware

Add middleware, configuration and templating to the Vivesbib API and split it into route modules.

This lab continues where Lab 04 ended: `src/app.js` contains a working genres API.

## Getting started

```bash
npm install
npm test
npm run dev
```

`npm test` runs the same checks as the autograder. Run a single requirement with `npm test -- --test-name-pattern="^R1:"`. The packages `morgan`, `config` and `pug` are already in `package.json`.

## Requirements

### R1: A custom logger middleware runs on every request
**2 points**

Create `src/middleware/logger.js` that exports a middleware function `(req, res, next)`: it logs `Middleware logger` with `console.log` and calls `next()`. Use it in `src/app.js` with `app.use(logger)`.

### R2: Genres can be created from form data
**1 point**

Add the built-in `express.urlencoded({ extended: true })` middleware, so `POST /api/genres` also works with a form body (`name=Comedy`) and not only with JSON.

### R3: morgan logs only in development
**2 points**

Use the third-party middleware `morgan('tiny')`, but only when `app.get('env') === 'development'`. Try it: `NODE_ENV=production npm start` (PowerShell: `$env:NODE_ENV="production"; npm start`) logs nothing.

### R4: Static files are served from public/
**1 point**

Create the folder `public` with a file `public.txt` containing some text. Serve the folder with `express.static`, so `GET /public.txt` returns the file. Tip: build the path with `path.join(__dirname, '..', 'public')`.

### R5: Configuration comes from the config package
**2 points**

Create the folder `config` with four files:

| File | Content |
|---|---|
| `default.json` | `{ "name": "Vivesbib", "db": { "version": "default" } }` |
| `development.json` | a `name` of your choice and `"db": { "version": "development" }` |
| `production.json` | a `name` of your choice and `"db": { "version": "production" }` |
| `custom-environment-variables.json` | `{ "db": { "password": "vivesbib_db_password" } }` |

`config.get('db.password')` then reads the password from the environment variable `vivesbib_db_password` (never store passwords in a file).

### R6: The homepage is rendered with pug
**1 point**

Set pug as view engine (`app.set('view engine', 'pug')`, views in the folder `views`). `GET /` renders `views/index.pug` with a `<title>` (use `config.get('name')`) and an `<h2>` with a welcome message containing `Welcome`.

### R7: Routes live in src/routes
**1 point**

Move the routes out of `src/app.js`: `src/routes/home.js` (the homepage) and `src/routes/genres.js` (all `/api/genres` routes), each exporting an `express.Router()`. In `src/app.js`: `app.use('/', home)` and `app.use('/api/genres', genres)`.

## Submitting

Commit your work and run `npm run submit`. Your score and feedback appear under **Releases** after a few minutes. You can submit as often as you like; the latest submission counts.
