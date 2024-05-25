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
const request = require('supertest')

describe('UserController (e2e)', () => {
    let app: INestApplication
    let organizationService: OrganizationService
    let authenticationService: AuthenticationService
    let roleService: RoleService
    let userService: UserService

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        authenticationService = moduleFixture.get(AuthenticationService)
        roleService = moduleFixture.get(RoleService)
        organizationService = moduleFixture.get(OrganizationService)
        userService = moduleFixture.get(UserService)

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

    describe('/users/authenticated-user (GET)', () => {
        it('should return 401 if user is not authenticated', async () => {
            return request(app.getHttpServer()).get('/users/authenticated-user').expect(401)
        })
        it('should return 200 and user data if user is authenticated', async () => {
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
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            return request(app.getHttpServer())
                .get('/users/authenticated-user')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        created_at: expect.any(String),
                        email: 'email@example.com',
                        first_name: 'John',
                        id: expect.any(String),
                        last_name: 'Doe',
                        organization: {
                            created_at: expect.any(String),
                            id: organization.id,
                            name: 'Test Organization',
                        },
                        roles: [RoleName.ADMIN],
                    })
                })
        })
    })
})
