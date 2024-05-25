import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../../../src/app.module'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import { getConnectionToken } from '@nestjs/typeorm'
import { mockOrganizationEntity } from '../../../src/modules/organization/tests/mocks/mockOrganizationEntity'
import { mockUserEntity } from '../../../src/modules/user/tests/mocks/mockUserEntity'
import { RoleName } from '../../../src/modules/role/enums/RoleName'
import { UserService } from '../../../src/modules/user/user.service'
import { OrganizationService } from '../../../src/modules/organization/organization.service'
import { RoleService } from '../../../src/modules/role/role.service'
import { AuthenticationService } from '../../../src/modules/authentication/authentication.service'
import { AuditLogService } from '../../../src/modules/audit-logs/audit-log.service'
import { AuditLogActionName } from '../../../src/common/enums/AuditLogActionName'
const request = require('supertest')

describe('OrganizationController (e2e)', () => {
    let app: INestApplication
    let organizationService: OrganizationService
    let authenticationService: AuthenticationService
    let roleService: RoleService
    let userService: UserService
    let auditLogService: AuditLogService

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        authenticationService = moduleFixture.get(AuthenticationService)
        roleService = moduleFixture.get(RoleService)
        organizationService = moduleFixture.get(OrganizationService)
        userService = moduleFixture.get(UserService)
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

    describe('/organizations (GET)', () => {
        it('should return 401 if not authenticated', async () => {
            await request(app.getHttpServer()).get('/organizations').expect(401)
        })
        it('should return organization details', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })

            await roleService.setUserRoles(user, [RoleName.ADMIN])
            await userService.confirmUser(user.id)
            const authResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .get('/organizations')
                .set('Authorization', `Bearer ${authResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        id: organization.id,
                        name: organization.name,
                        created_at: expect.any(String),
                    })
                })
        })
    })
    describe('/organizations (PATCH)', () => {
        it('should return 401 if not authenticated', async () => {
            await request(app.getHttpServer()).patch('/organizations').expect(401)
        })
        it('should return 403 if user has EDITOR role', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })

            await roleService.setUserRoles(user, [RoleName.EDITOR])
            await userService.confirmUser(user.id)
            const authResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .patch('/organizations')
                .set('Authorization', `Bearer ${authResponse.body.jwt_token}`)
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Forbidden',
                        message: 'User does not have required roles to access this resource.',
                        statusCode: 403,
                    })
                })
        })
        it('should return 403 if user has VIEWER role', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })

            await roleService.setUserRoles(user, [RoleName.VIEWER])
            await userService.confirmUser(user.id)
            const authResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .patch('/organizations')
                .set('Authorization', `Bearer ${authResponse.body.jwt_token}`)
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Forbidden',
                        message: 'User does not have required roles to access this resource.',
                        statusCode: 403,
                    })
                })
        })
        it('should not update the organization name if no name is provided', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })

            await roleService.setUserRoles(user, [RoleName.ADMIN])
            await userService.confirmUser(user.id)
            const authResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .patch('/organizations')
                .send({})
                .set('Authorization', `Bearer ${authResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        created_at: expect.any(String),
                        deleted_at: null,
                        id: organization.id,
                        name: organization.name,
                        updated_at: expect.any(String),
                    })
                })
            const organizationAfterUpdate = await organizationService.findById(organization.id)
            expect(organizationAfterUpdate.name).toEqual(organization.name)
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_ORGANIZATION_DETAILS,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 200,
                    user_id: user.id,
                },
            ])
        })
        it('should update the organization name if name is provided', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })

            await roleService.setUserRoles(user, [RoleName.ADMIN])
            await userService.confirmUser(user.id)
            const authResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .patch('/organizations')
                .send({ name: 'new name' })
                .set('Authorization', `Bearer ${authResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        created_at: expect.any(String),
                        deleted_at: null,
                        id: organization.id,
                        name: 'new name',
                        updated_at: expect.any(String),
                    })
                })
            const organizationAfterUpdate = await organizationService.findById(organization.id)
            expect(organizationAfterUpdate.name).toEqual('new name')
            const auditLogs = await auditLogService.getAll()
            expect(auditLogs).toEqual([
                {
                    action: AuditLogActionName.SIGN_IN,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_ORGANIZATION_DETAILS,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: { name: 'new name' },
                    status_code: 200,
                    user_id: user.id,
                },
            ])
        })
    })
})
