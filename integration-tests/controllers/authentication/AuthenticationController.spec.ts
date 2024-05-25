import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../../../src/app.module'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import { getConnectionToken } from '@nestjs/typeorm'
import { UserService } from '../../../src/modules/user/user.service'
import { OrganizationService } from '../../../src/modules/organization/organization.service'
import { UserEntityRelation } from '../../../src/modules/user/enums/UserEntityRelation'
import { RoleName } from '../../../src/modules/role/enums/RoleName'
import { mockOrganizationEntity } from '../../../src/modules/organization/tests/mocks/mockOrganizationEntity'
import { mockUserEntity } from '../../../src/modules/user/tests/mocks/mockUserEntity'
import { AuthenticationService } from '../../../src/modules/authentication/authentication.service'
import { parseCookies } from '../../../src/common/utils/parseCookies'
import { hashSecret } from '../../../src/common/utils/hashSecret'
import { AuditLogService } from '../../../src/modules/audit-logs/audit-log.service'
import { AuditLogActionName } from '../../../src/common/enums/AuditLogActionName'

const request = require('supertest')

describe('AuthenticationController (e2e)', () => {
    let app: INestApplication
    let userService: UserService
    let organizationService: OrganizationService
    let authenticationService: AuthenticationService
    let auditLogService: AuditLogService

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        organizationService = moduleFixture.get(OrganizationService)
        userService = moduleFixture.get(UserService)
        authenticationService = moduleFixture.get(AuthenticationService)
        auditLogService = moduleFixture.get(AuditLogService)

        app = moduleFixture.createNestApplication()
        app.useGlobalPipes(new ValidationPipe({ transform: true }))
        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(cookieParser())
        await app.init()
    })

    async function cleanDatabase() {
        const connection = app.get(getConnectionToken())
        await connection.query('DELETE FROM audit_logs;')
        await connection.query('DELETE FROM projects;')
        await connection.query('DELETE FROM user_roles;')
        await connection.query('DELETE FROM forgot_password_requests;')
        await connection.query('DELETE FROM users;')
        await connection.query('DELETE FROM organizations;')
    }

    afterEach(async () => {
        await cleanDatabase()
    })

    afterAll(async () => {
        await app.close()
    })

    describe('/signup (POST)', () => {
        it('should return an error if email is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    password: mockUserEntity.password,
                    first_name: mockUserEntity.first_name,
                    last_name: mockUserEntity.last_name,
                    organization_name: mockOrganizationEntity.name,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'email must be shorter than or equal to 255 characters',
                            'email should not be empty',
                            'email must be an email',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: '{"message":["email must be shorter than or equal to 255 characters","email should not be empty","email must be an email"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if email is not valid', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    email: 'notanemail',
                    password: mockUserEntity.password,
                    first_name: mockUserEntity.first_name,
                    last_name: mockUserEntity.last_name,
                    organization_name: mockOrganizationEntity.name,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['email must be an email'],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: '{"message":["email must be an email"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if password is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    email: mockUserEntity.email,
                    first_name: mockUserEntity.first_name,
                    last_name: mockUserEntity.last_name,
                    organization_name: mockOrganizationEntity.name,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'password must be longer than or equal to 8 characters',
                            'password must be shorter than or equal to 255 characters',
                            'password should not be empty',
                            'password must be a string',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: '{"message":["password must be longer than or equal to 8 characters","password must be shorter than or equal to 255 characters","password should not be empty","password must be a string"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if password is too short', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    email: mockUserEntity.email,
                    first_name: mockUserEntity.first_name,
                    last_name: mockUserEntity.last_name,
                    organization_name: mockOrganizationEntity.name,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'password must be longer than or equal to 8 characters',
                            'password must be shorter than or equal to 255 characters',
                            'password should not be empty',
                            'password must be a string',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: '{"message":["password must be longer than or equal to 8 characters","password must be shorter than or equal to 255 characters","password should not be empty","password must be a string"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if first_name is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    email: mockUserEntity.email,
                    password: mockUserEntity.password,
                    last_name: mockUserEntity.last_name,
                    organization_name: mockOrganizationEntity.name,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'first_name must be shorter than or equal to 100 characters',
                            'first_name should not be empty',
                            'first_name must be a string',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: '{"message":["first_name must be shorter than or equal to 100 characters","first_name should not be empty","first_name must be a string"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if last_name is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    password: mockUserEntity.password,
                    email: mockUserEntity.email,
                    first_name: mockUserEntity.first_name,
                    organization_name: mockOrganizationEntity.name,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'last_name must be shorter than or equal to 100 characters',
                            'last_name should not be empty',
                            'last_name must be a string',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: '{"message":["last_name must be shorter than or equal to 100 characters","last_name should not be empty","last_name must be a string"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return 200 if user with the same email already exists but should not create a new user', async () => {
            const organization = await organizationService.create('Test org 1')
            await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: 'first',
                lastName: 'Last',
                organizationId: organization.id,
            })
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    password: mockUserEntity.password,
                    email: mockUserEntity.email,
                    first_name: mockUserEntity.first_name,
                    last_name: mockUserEntity.last_name,
                    organization_name: mockOrganizationEntity.name,
                })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            expect(await userService.getNumberOfUsers()).toBe(1)
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should return 200 and create a new user', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    password: mockUserEntity.password,
                    email: mockUserEntity.email,
                    first_name: mockUserEntity.first_name,
                    last_name: mockUserEntity.last_name,
                    organization_name: mockOrganizationEntity.name,
                })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            const user = await userService.findByEmail(mockUserEntity.email, [
                UserEntityRelation.ROLES,
                UserEntityRelation.ORGANIZATION,
            ])
            expect(user).toEqual({
                id: expect.any(String),
                confirmed_at: null,
                created_at: expect.any(Date),
                deleted_at: null,
                email: 'email@example.com',
                first_name: 'John',
                last_name: 'Doe',
                organization: {
                    created_at: expect.any(Date),
                    deleted_at: null,
                    id: expect.any(String),
                    name: 'Test Organization',
                    updated_at: expect.any(Date),
                },
                organization_id: expect.any(String),
                password: expect.any(String),
                roles: [
                    {
                        id: expect.any(String),
                        name: 'admin',
                        created_at: expect.any(Date),
                        updated_at: expect.any(Date),
                    },
                ],
                updated_at: expect.any(Date),
            })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should return 200 and create a new user with default organization name', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    password: mockUserEntity.password,
                    email: mockUserEntity.email,
                    first_name: mockUserEntity.first_name,
                    last_name: mockUserEntity.last_name,
                })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            const user = await userService.findByEmail(mockUserEntity.email, [
                UserEntityRelation.ROLES,
                UserEntityRelation.ORGANIZATION,
            ])
            expect(user).toEqual({
                id: expect.any(String),
                email: mockUserEntity.email,
                first_name: mockUserEntity.first_name,
                last_name: mockUserEntity.last_name,
                created_at: expect.any(Date),
                updated_at: expect.any(Date),
                deleted_at: null,
                confirmed_at: null,
                organization_id: expect.any(String),
                password: expect.any(String),
                organization: {
                    id: expect.any(String),
                    name: `${mockUserEntity.first_name} ${mockUserEntity.last_name}`,
                    created_at: expect.any(Date),
                    updated_at: expect.any(Date),
                    deleted_at: null,
                },
                roles: [
                    {
                        id: expect.any(String),
                        name: RoleName.ADMIN,
                        created_at: expect.any(Date),
                        updated_at: expect.any(Date),
                    },
                ],
            })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should return 200 and create a new user but the user should not be able to login until the email is confirmed', async () => {
            await request(app.getHttpServer())
                .post('/auth/signup')
                .send({
                    password: mockUserEntity.password,
                    email: mockUserEntity.email,
                    first_name: mockUserEntity.first_name,
                    last_name: mockUserEntity.last_name,
                })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    password: mockUserEntity.password,
                    email: mockUserEntity.email,
                })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({
                        message: 'Forbidden',
                        statusCode: 403,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_UP,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: '{"message":"Forbidden","statusCode":403}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: mockUserEntity.email,
                    },
                    status_code: 403,
                    user_id: null,
                },
            ])
        })
    })
    describe('/signin (POST)', () => {
        it('should return an error if email is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    password: mockUserEntity.password,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'email must be shorter than or equal to 255 characters',
                            'email should not be empty',
                            'email must be an email',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: '{"message":["email must be shorter than or equal to 255 characters","email should not be empty","email must be an email"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if email is not valid', async () => {
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: 'notanemail',
                    password: mockUserEntity.password,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['email must be an email'],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: '{"message":["email must be an email"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: 'notanemail',
                    },
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if password is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: mockUserEntity.email,
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'password must be longer than or equal to 8 characters',
                            'password must be shorter than or equal to 255 characters',
                            'password should not be empty',
                            'password must be a string',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: '{"message":["password must be longer than or equal to 8 characters","password must be shorter than or equal to 255 characters","password should not be empty","password must be a string"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: mockUserEntity.email,
                    },
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if user does not exists', async () => {
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: 'random-email@email.com',
                    password: mockUserEntity.password,
                })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({ message: 'Forbidden', statusCode: 403 })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: '{"message":"Forbidden","statusCode":403}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: 'random-email@email.com',
                    },
                    status_code: 403,
                    user_id: null,
                },
            ])
        })
        it('should return an error if user exists but is not confirmed', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)

            await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: 'random-email@email.com',
                    password: mockUserEntity.password,
                })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({ message: 'Forbidden', statusCode: 403 })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: '{"message":"Forbidden","statusCode":403}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: 'random-email@email.com',
                    },
                    status_code: 403,
                    user_id: null,
                },
            ])
        })
        it('should return an error if password is incorrect', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)

            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: mockUserEntity.email,
                    password: 'incorrect-password',
                })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({ message: 'Forbidden', statusCode: 403 })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: '{"message":"Forbidden","statusCode":403}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: mockUserEntity.email,
                    },
                    status_code: 403,
                    user_id: null,
                },
            ])
        })
        it('should login the user', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const response = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            expect(response.body).toEqual({
                jwt_token: expect.any(String),
                jwt_token_expires_in: 1800000,
                refresh_token: expect.any(String),
                refresh_token_expires_in: 86400000,
                remember_me: false,
            })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: mockUserEntity.email,
                    },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should login the user and set remember_me cookie', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const response = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
                remember_me: true,
            })
            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                jwt_token: expect.any(String),
                jwt_token_expires_in: 1800000,
                refresh_token: expect.any(String),
                refresh_token_expires_in: 2678400000,
                remember_me: true,
            })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: mockUserEntity.email,
                    },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
    })
    describe('refresh-token (POST)', () => {
        it('should return an error if refresh_token is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh-token')
                .send({})
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['refresh_token should not be empty', 'refresh_token must be a string'],
                        statusCode: 400,
                    })
                })
        })
        it('should return an error if refresh_token is not valid', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh-token')
                .send({ refresh_token: 'invalid-token' })
                .expect(401)
                .then((response) => {
                    expect(response.body).toEqual({ message: 'Unauthorized', statusCode: 401 })
                })
        })
        it('should refresh a token', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
                remember_me: false,
            })
            const response = await request(app.getHttpServer()).post('/auth/refresh-token').send({
                refresh_token: signInResponse.body.refresh_token,
            })
            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                jwt_token: expect.any(String),
                jwt_token_expires_in: 1800000,
                refresh_token: expect.any(String),
                refresh_token_expires_in: 86400000,
                remember_me: false,
            })
        })
        it('should refresh a token and set remember_me cookie to true', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
                remember_me: true,
            })
            const response = await request(app.getHttpServer()).post('/auth/refresh-token').send({
                refresh_token: signInResponse.body.refresh_token,
            })
            expect(response.status).toBe(200)
            expect(response.body).toEqual({
                jwt_token: expect.any(String),
                jwt_token_expires_in: 1800000,
                refresh_token: expect.any(String),
                refresh_token_expires_in: 2678400000,
                remember_me: true,
            })
        })
    })
    describe('signout (POST)', () => {
        it('should return an error if user is not authenticated', async () => {
            await request(app.getHttpServer())
                .post('/auth/signout')
                .expect(401)
                .then((response) => {
                    expect(response.body).toEqual({ message: 'Unauthorized', statusCode: 401 })
                })
        })
        it('should return an error if ivnalid token is provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/signout')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401)
                .then((response) => {
                    expect(response.body).toEqual({ message: 'Unauthorized', statusCode: 401 })
                })
        })
        it('should signout the user', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            const response = await request(app.getHttpServer())
                .post('/auth/signout')
                .set('Authorization', `Bearer ${signInResponse.body.jwt_token}`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
            const parsedCookies = parseCookies(response.header['set-cookie'] as [])
            expect(parsedCookies).toEqual([
                {
                    expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
                    httponly: true,
                    name: 'jwt_token',
                    path: '/',
                    secure: true,
                    value: '',
                },
                {
                    expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
                    httponly: true,
                    name: 'refresh_token',
                    path: '/',
                    secure: true,
                    value: '',
                },
                {
                    expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
                    httponly: true,
                    name: 'remember_me',
                    path: '/',
                    secure: true,
                    value: '',
                },
            ])
        })
    })
    describe('forgot-password (POST)', () => {
        it('should return an error if email is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({})
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['email must be an email', 'email should not be empty'],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.FORGOT_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":["email must be an email","email should not be empty"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if email is not valid', async () => {
            await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({ email: 'notanemail' })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['email must be an email'],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.FORGOT_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":["email must be an email"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        email: 'notanemail',
                    },
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return 200 if user with the email does not exist but should not send an email', async () => {
            await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({ email: 'invalid@email.com' })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            const forgotPasswordRequests = await authenticationService.getForgotPasswordRequestsByUserId(
                mockUserEntity.id,
            )
            expect(forgotPasswordRequests).toEqual([])
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.FORGOT_PASSWORD,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: 'invalid@email.com' },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should return 200 if user exists but email address is not confirmed. This should not send an email', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({ email: mockUserEntity.email })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            const forgotPasswordRequests = await authenticationService.getForgotPasswordRequestsByUserId(
                mockUserEntity.id,
            )
            expect(forgotPasswordRequests).toEqual([])
            // should not invalidate the user's password
            const updatedUser = await userService.findByEmail(mockUserEntity.email)
            expect(updatedUser.password).toEqual(user.password)
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.FORGOT_PASSWORD,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should return 200 and send an email', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({ email: mockUserEntity.email })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            const updatedUser = await userService.findByEmail(mockUserEntity.email)
            const forgotPasswordRequests = await authenticationService.getForgotPasswordRequestsByUserId(user.id)
            expect(forgotPasswordRequests).toEqual([
                {
                    id: expect.any(String),
                    user_id: user.id,
                    hash: expect.any(String),
                    created_at: expect.any(Date),
                    updated_at: expect.any(Date),
                    is_valid: true,
                    user: expect.any(Object),
                },
            ])
            // should invalidate the user's password
            expect(updatedUser.password).not.toEqual(hashSecret(mockUserEntity.password))
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.FORGOT_PASSWORD,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
    })
    describe('forgot-password/:hash (GET)', () => {
        it('should return false if hash is not valid', async () => {
            await request(app.getHttpServer())
                .get('/auth/forgot-password/invalid-hash')
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        is_valid: false,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.VALIDATE_FORGOT_PASSWORD_HASH,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should return false if hash is already used', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const forgotPasswordRequest = await authenticationService.saveForgotPasswordRequest(user.id, 'valid-hash')
            await authenticationService.invalidateForgotPasswordHashByHash(forgotPasswordRequest.hash)
            await request(app.getHttpServer())
                .get('/auth/forgot-password/valid-hash')
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        is_valid: false,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.VALIDATE_FORGOT_PASSWORD_HASH,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should return true if hash is valid', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            await authenticationService.saveForgotPasswordRequest(user.id, 'valid-hash')
            await request(app.getHttpServer())
                .get('/auth/forgot-password/valid-hash')
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        is_valid: true,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.VALIDATE_FORGOT_PASSWORD_HASH,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
    })
    describe('set-new-password (POST)', () => {
        it('should return an error if password is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/set-new-password')
                .send({ hash: 'valid-hash' })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'password must be a string',
                            'password should not be empty',
                            'password must be longer than or equal to 8 characters',
                            'forgot_password_hash must be a string',
                            'forgot_password_hash should not be empty',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SET_NEW_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":["password must be a string","password should not be empty","password must be longer than or equal to 8 characters","forgot_password_hash must be a string","forgot_password_hash should not be empty"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if hash is not provided', async () => {
            await request(app.getHttpServer())
                .post('/auth/set-new-password')
                .send({ password: mockUserEntity.password })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['forgot_password_hash must be a string', 'forgot_password_hash should not be empty'],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SET_NEW_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":["forgot_password_hash must be a string","forgot_password_hash should not be empty"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if hash is not valid', async () => {
            await request(app.getHttpServer())
                .post('/auth/set-new-password')
                .send({ password: mockUserEntity.password, hash: 'invalid-hash' })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['forgot_password_hash must be a string', 'forgot_password_hash should not be empty'],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SET_NEW_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":["forgot_password_hash must be a string","forgot_password_hash should not be empty"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: null,
                },
            ])
        })
        it('should return an error if hash is already used', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const forgotPasswordRequest = await authenticationService.saveForgotPasswordRequest(user.id, 'valid-hash')
            await authenticationService.invalidateForgotPasswordHashByHash(forgotPasswordRequest.hash)
            await request(app.getHttpServer())
                .post('/auth/set-new-password')
                .send({ password: 'new-password', forgot_password_hash: forgotPasswordRequest.hash })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({ message: 'Forbidden', statusCode: 403 })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SET_NEW_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":"Forbidden","statusCode":403}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 403,
                    user_id: null,
                },
            ])
        })
        it('should set a new password', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const forgotPasswordRequest = await authenticationService.saveForgotPasswordRequest(user.id, 'valid-hash')
            await request(app.getHttpServer())
                .post('/auth/set-new-password')
                .send({ password: 'new-password', forgot_password_hash: forgotPasswordRequest.hash })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            //    should invalidate the hash
            const updatedForgotPasswordRequest = await authenticationService.getForgotPasswordHashByHash(
                forgotPasswordRequest.hash,
            )
            expect(updatedForgotPasswordRequest.is_valid).toBe(false)
            //    should update the user's password
            const updatedUser = await userService.findByEmail(mockUserEntity.email)
            expect(updatedUser.password).not.toEqual(user.password)
            //   should be able to login with the new password
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: mockUserEntity.email,
                    password: 'new-password',
                })
                .expect(200)
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SET_NEW_PASSWORD,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
    })
    describe('/password (POST)', () => {
        it('should return an error if user is not authenticated', async () => {
            await request(app.getHttpServer())
                .post('/auth/password')
                .expect(401)
                .then((response) => {
                    expect(response.body).toEqual({ message: 'Unauthorized', statusCode: 401 })
                })
        })
        it('should return an error if old_password is not provided', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/auth/password')
                .set('Authorization', `Bearer ${signInResponse.body.jwt_token}`)
                .send({ new_password: 'new-password' })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'old_password must be a string',
                            'old_password should not be empty',
                            'old_password must be longer than or equal to 8 characters',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":["old_password must be a string","old_password should not be empty","old_password must be longer than or equal to 8 characters"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: user.id,
                },
            ])
        })
        it('should return an error if new_password is not provided', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/auth/password')
                .set('Authorization', `Bearer ${signInResponse.body.jwt_token}`)
                .send({ old_password: mockUserEntity.password })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'new_password must be a string',
                            'new_password should not be empty',
                            'new_password must be longer than or equal to 8 characters',
                        ],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":["new_password must be a string","new_password should not be empty","new_password must be longer than or equal to 8 characters"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: user.id,
                },
            ])
        })
        it('should return an password if new_password is too short', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/auth/password')
                .set('Authorization', `Bearer ${signInResponse.body.jwt_token}`)
                .send({ old_password: mockUserEntity.password, new_password: 'short' })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['new_password must be longer than or equal to 8 characters'],
                        statusCode: 400,
                    })
                })
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":["new_password must be longer than or equal to 8 characters"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: user.id,
                },
            ])
        })
        it('should return an error if old_password is incorrect', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/auth/password')
                .set('Authorization', `Bearer ${signInResponse.body.jwt_token}`)
                .send({ old_password: 'incorrect-password', new_password: 'new-password' })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Forbidden',
                        message: 'Old password is incorrect',
                        statusCode: 403,
                    })
                })
            // User should still be able to login with the old password
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: mockUserEntity.email,
                    password: mockUserEntity.password,
                })
                .expect(200)
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":"Old password is incorrect","error":"Forbidden","statusCode":403}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 403,
                    user_id: user.id,
                },
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should return an error if old_password is the same as new_password', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/auth/password')
                .set('Authorization', `Bearer ${signInResponse.body.jwt_token}`)
                .send({ old_password: mockUserEntity.password, new_password: mockUserEntity.password })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Forbidden',
                        message: 'New password cannot be the same as the old password',
                        statusCode: 403,
                    })
                })
            // User should still be able to login with the old password
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: mockUserEntity.email,
                    password: mockUserEntity.password,
                })
                .expect(200)
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_PASSWORD,
                    created_at: expect.any(Date),
                    error: '{"message":"New password cannot be the same as the old password","error":"Forbidden","statusCode":403}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 403,
                    user_id: user.id,
                },
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: mockUserEntity.email },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
        it('should update the password', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            await userService.confirmUser(user.id)
            const signInResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/auth/password')
                .set('Authorization', `Bearer ${signInResponse.body.jwt_token}`)
                .send({ old_password: mockUserEntity.password, new_password: 'new-password' })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            // User should not be able to login with the old password
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: mockUserEntity.email,
                    password: mockUserEntity.password,
                })
                .expect(403)
            // User should be able to login with the new password
            await request(app.getHttpServer())
                .post('/auth/signin')
                .send({
                    email: mockUserEntity.email,
                    password: 'new-password',
                })
                .expect(200)
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: 'SIGN_IN',
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: 'UPDATE_PASSWORD',
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: user.id,
                },
                {
                    action: 'SIGN_IN',
                    created_at: expect.any(Date),
                    error: '{"message":"Forbidden","statusCode":403}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: 'email@example.com' },
                    status_code: 403,
                    user_id: null,
                },
                {
                    action: 'SIGN_IN',
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
            ])
        })
    })
})
