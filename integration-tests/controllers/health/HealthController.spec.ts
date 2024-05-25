import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../../../src/app.module'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'

const request = require('supertest')

describe('HealthController (e2e)', () => {
    let app: INestApplication

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        app.useGlobalPipes(new ValidationPipe({ transform: true }))
        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(cookieParser())

        await app.init()
    })
    afterAll(async () => {
        await app.close()
    })

    describe('/health (GET)', () => {
        it('should return 200', async () => {
            return request(app.getHttpServer())
                .get('/health')
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual(expect.any(Object))
                })
        })
    })
})
