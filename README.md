<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Environment

Use `.env.example` as the single source of truth:

```bash
cp .env.example .env
```

The default values in `.env.example` are intended for Docker Compose:

- `DB_HOST=postgres`
- `REDIS_HOST=redis`
- `MAIL_HOST=mailhog`

If you run the app directly outside Docker, change these hosts to `localhost`.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Authentication

Login, refresh-token rotation, logout, PostgreSQL session storage, and Redis
blacklist are described in [docs/authentication.md](docs/authentication.md).

## Docker deployment

The current Docker stack includes:

- `app`: NestJS production build
- `migrate`: runs TypeORM migrations before the app starts
- `postgres`: PostgreSQL 16
- `redis`: Redis 7
- `mailhog`: SMTP test + web UI

### Step 1. Prepare env

```bash
cp .env.example .env
```

Change at least the following values before running a shared environment:

- `JWT_ACCESS_SECRET`
- `DB_PASSWORD`
- `MAIL_FROM`

### Step 2. Build and start the full stack

```bash
docker compose up --build -d
```

### Step 3. Check containers

```bash
docker compose ps
docker compose logs migrate
docker compose logs app
```

Expected:

- `migrate` exits successfully
- `app` listens on port `3000` or the `PORT` value from `.env`
- `mailhog` web UI is available at `http://localhost:8025`

### Step 4. Quick API test

```bash
curl http://localhost:3000/api
```

### Step 5. Stop the stack when not in use

```bash
docker compose down
```

If you also want to remove the database, Redis, and uploads volumes:

```bash
docker compose down -v
```

### Notes

- Uploads are mounted to the `uploads_data` volume, so restarting containers does not remove uploaded files.
- `migrate` is a one-shot service. Each time `docker compose up` runs, it applies migrations before `app` starts.
- The scheduler and Bull worker currently run inside `app`, so this container serves the API and processes background jobs.
- For a real production deployment, replace `mailhog` with a real SMTP service and do not expose port `8025`.

## CI

The GitHub Actions workflow lives at `.github/workflows/ci.yml` and uses Node.js 22 with `package-lock.json`; it does not upgrade or downgrade dependencies.

CI runs when a pull request to `master` is opened or updated, when `master` receives a push, or when the workflow is triggered manually:

1. Install dependencies with `npm ci`.
2. Run lint with `npm run lint`.
3. Check TypeScript with `npm run typecheck`.
4. Run unit tests with `npm test -- --runInBand`.
5. Build NestJS with `npm run build`.

The workflow currently runs CI only. It does not include CD, does not build or push Docker images, and does not access any production environment.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
