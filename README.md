## Starting the app

1. Copy the `.env.example` file to `.env` and fill in the environment variables.
```bash
$ cp .env.example .env
```
2. Install the dependencies
```bash
$ yarn
```
3.a Start the app locally
```bash
$ yarn start:dev
```
3.b Start the app inside a docker container (**Recommended**)
```bash
```bash
$ docker-compose up
```
4.Run migrations
```bash
$ docker exec -it app yarn migration:run
```
## Creating a new migration

```bash
# unit tests
$ yarn migration:create ./src/migration/**migration_name**
```

## Running migrations

There are two ways to run migrations:

1. If you are running the app inside a docker container, you can run the following command:
```bash
$ docker exec -it app yarn migration:run
```

2. If you are running the app locally, you can run the following command:
```bash
$ yarn yarn migration:run
```

## Reverting migrations

This will execute the down method of the **lastly executed** migration.

```bash
$ docker exec -it app yarn migration:revert
```

2. If you are running the app locally, you can run the following command:
```bash
$ yarn yarn migration:revert
```

## Unit tests
Running the unit tests in local environment:
```bash
$ yarn test
```

## Integration tests
### *** This process needs to be optimized in the future ***
1. Start integration tests environment
```bash
yarn start:integrationtestenv
```
2. Run the integration tests
```bash
docker exec -it integration-tests-app yarn test:integration
```

## Linting and formatting
### Formatting
```bash
$ yarn format
```
### Linting
```bash
$ yarn lint
```

## Swagger
The API documentation is available at `http://localhost:{PORT}/api-docs`. This route is
protected by a basic authentication. The default credentials are:
- Username: `username`
- Password: `password`
