import { LoggerService } from '@nestjs/common'
import winston = require('winston')
import { Logger as WinstonLogger } from 'winston'
import { Logger as TOLogger, QueryRunner } from 'typeorm'
import { ClsService, ClsServiceManager } from 'nestjs-cls'
import { AppEnv } from '../../common/enums/AppEnv'

const logLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        trace: 5,
    },
}

export class Logger implements LoggerService {
    private readonly logger: WinstonLogger
    private readonly clsService: ClsService
    constructor(private readonly service: string = 'api') {
        this.service = service
        this.logger = this.initWinston()
        this.clsService = ClsServiceManager.getClsService()
    }
    public log(message: string, ...optionalParams: any[]) {
        const params = this.prepareOptionalParams(optionalParams)
        this.logger.info(message, params)
    }
    public error(message: string, ...optionalParams: any[]) {
        const params = this.prepareOptionalParams(optionalParams)
        this.logger.error(message, params)
    }
    public warn(message: string, ...optionalParams: any[]) {
        const params = this.prepareOptionalParams(optionalParams)
        this.logger.warn(message, params)
    }
    public debug(message: string, ...optionalParams: any[]) {
        if (this.clsService.get('endpoint') === '/health') return
        const params = this.prepareOptionalParams(optionalParams)
        this.logger.debug(message, params)
    }

    private prepareOptionalParams(optionalParams: any[] = []) {
        const { params, tags, stack } = optionalParams.reduce(
            (acc: { params: object; tags: string[]; stack?: string }, param) => {
                if (typeof param === 'string' && !param.startsWith('Error:')) acc.tags.push(param)
                if (typeof param === 'string' && param.startsWith('Error:')) acc.stack = param
                if (typeof param === 'object') acc.params = { ...acc.params, ...param }
                return acc
            },
            {
                params: {
                    request_id: this.clsService.getId(),
                    amzn_trace_root: this.clsService.get('x-amzn-root'),
                    amzn_trace_self: this.clsService.get('x-amzn-self'),
                    endpoint: this.clsService.get('endpoint'),
                },
                tags: [],
                stack: undefined,
            },
        )
        return {
            extra: params,
            tags,
            stack,
        }
    }

    private initWinston(): WinstonLogger {
        const env = process.env.ENV || AppEnv.LOCAL
        const format =
            env === AppEnv.LOCAL
                ? winston.format.combine(
                      winston.format.colorize({ message: true }),
                      winston.format.timestamp(),
                      winston.format.simple(),
                  )
                : winston.format.combine(winston.format.timestamp(), winston.format.json())
        const logger = winston.createLogger({
            levels: logLevels.levels,
            level: 'debug',
            format,
            defaultMeta: {
                meta: { service: this.service },
            },
            transports: [
                new winston.transports.Console({
                    handleExceptions: true,
                    handleRejections: true,
                }),
            ],
            exitOnError: false,
        })
        return logger
    }
}

export class TypeOrmLogger implements TOLogger {
    // taken from https://github.com/jtmthf/nestjs-pino-logger/issues/2
    private readonly logger = new Logger(this.service)
    private loggingEnabled: boolean = true
    constructor(private readonly service: string = 'TypeOrm') {}

    public updateLoggingEnabled(isEnabled: boolean) {
        this.loggingEnabled = isEnabled
    }

    public async logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (!this.loggingEnabled) return
        const sql =
            query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '')
        this.logger.debug(sql, {
            connection: {
                initialised: queryRunner?.connection.isInitialized,
                released: queryRunner?.isReleased,
            },
        })
    }

    public logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (!this.loggingEnabled) return
        const sql =
            query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '')
        this.logger.error(sql, {
            connection: {
                initialised: queryRunner?.connection.isInitialized,
                released: queryRunner?.isReleased,
            },
        })
    }

    public logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (!this.loggingEnabled) return
        const sql =
            query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '')
        this.logger.log(sql, {
            connection: {
                initialised: queryRunner?.connection.isInitialized,
                released: queryRunner?.isReleased,
            },
        })
    }

    public logSchemaBuild(message: string) {
        if (!this.loggingEnabled) return
        this.logger.debug(message)
    }

    public logMigration(message: string) {
        if (!this.loggingEnabled) return
        this.logger.debug(message)
    }

    public log(level: 'log' | 'info' | 'warn', message: any) {
        if (!this.loggingEnabled) return
        switch (level) {
            case 'log':
            case 'info':
                this.logger.log(message)
                break
            case 'warn':
                this.logger.warn(message)
                break
        }
    }

    public error(message: string) {
        this.logger.error(message)
    }

    protected stringifyParams(parameters: any[]) {
        try {
            return JSON.stringify(parameters)
        } catch (error) {
            // most probably circular objects in parameters
            return parameters
        }
    }
}
