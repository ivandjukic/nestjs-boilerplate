import { join } from 'path'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { isConfigParameterEnabled } from './common/utils/isConfigParameterEnabled'
import { TypeOrmLogger } from './modules/logger/logger'
import * as dotenv from 'dotenv'
import { AppEnv } from './common/enums/AppEnv'

dotenv.config()

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: process.env.ENV === AppEnv.LOCAL || process.env.ENV === AppEnv.INTEGRATION_TEST ? false : true,
    extra:
        process.env.ENV === AppEnv.LOCAL || process.env.ENV === AppEnv.INTEGRATION_TEST
            ? undefined
            : {
                  ssl: {
                      rejectUnauthorized: false,
                  },
              },
    synchronize: process.env.RUN_MIGRATIONS ? isConfigParameterEnabled(process.env.RUN_MIGRATIONS) : false,
    logging: false,
    entities: [join(__dirname, '..', 'src', '*', 'entity', '*.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    logger: new TypeOrmLogger(),
})
