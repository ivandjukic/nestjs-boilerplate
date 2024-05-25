import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EnvVariableName } from './common/enums/EnvVariableName'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import basicAuth = require('express-basic-auth')
import { Logger } from './modules/logger/logger'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { logger: new Logger('Nest') })
    app.useLogger(app.get(Logger))

    const configService = app.get<ConfigService>(ConfigService)

    app.use(
        ['/api-docs'],
        basicAuth({
            challenge: true,
            users: {
                username: 'password',
            },
        }),
    )

    const config = new DocumentBuilder()
        .setTitle('API')
        .setDescription('API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api-docs', app, document)
    app.useGlobalPipes(new ValidationPipe({ transform: true }))
    const webAppUrl = configService.getOrThrow<string>(EnvVariableName.WEB_APP_URL)
    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
    app.enableCors({
        origin: [webAppUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
        allowedHeaders: [
            'access-control-allow-origin',
            'authorization',
            'content-type',
            'baggage',
            'sentry-trace',
            'access-control-allow-credentials',
            'access-control-expose-headers',
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    })

    app.use(cookieParser())

    await app.listen(configService.getOrThrow<number>(EnvVariableName.PORT))
}
bootstrap()
