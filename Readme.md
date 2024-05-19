# Senior Software Engineer - Finance team live coding interview

## Steps for running the repo

1. Run the db with docker

```bash
docker-compose up
```

2. Install Node 20 (you can use [nvm](https://github.com/nvm-sh/nvm))

```bash
nvm install 20
```

3. Install yarn

```bash
npm install -g yarn
```

4. Install dependencies

```bash
yarn install
```

5. Run the migrations

```bash
yarn run knex migrate:latest
```

6. Run the test file

```bash
yarn test
```

7. If you need to create a migration, run

```bash
yarn run knex migrate:make <migration_name>
```

8. If you need to rollback the migrations, run

```bash
yarn run knex migrate:rollback
```
