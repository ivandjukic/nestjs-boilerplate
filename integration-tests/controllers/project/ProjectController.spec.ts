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
import { ProjectService } from '../../../src/modules/project/project.service'
import { randomUUID } from 'crypto'
import { AuditLogService } from '../../../src/modules/audit-logs/audit-log.service'
import { AuditLogActionName } from '../../../src/common/enums/AuditLogActionName'
const request = require('supertest')

describe('ProjectController (e2e)', () => {
    let app: INestApplication
    let organizationService: OrganizationService
    let authenticationService: AuthenticationService
    let projectService: ProjectService
    let roleService: RoleService
    let userService: UserService
    let auditLogService: AuditLogService

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        authenticationService = moduleFixture.get(AuthenticationService)
        projectService = moduleFixture.get(ProjectService)
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

    describe('/projects (GET)', () => {
        it('should return 401 if user is not authenticated', async () => {
            await request(app.getHttpServer()).get('/projects').expect(401)
        })
        it('should return an empty array if user has no projects', async () => {
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
            await request(app.getHttpServer())
                .get('/projects')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        pagination: {
                            current_page: 1,
                            next_page: null,
                            per_page: 20,
                            previous_page: null,
                            total_items: 0,
                            total_pages: 1,
                        },
                        projects: [],
                    })
                })
        })
        it('should return an array of projects if user has projects', async () => {
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
            const project = await projectService.create({
                userId: user.id,
                name: 'Project 1',
                description: 'Description 1',
            })
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .get('/projects')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        pagination: {
                            current_page: 1,
                            next_page: null,
                            per_page: 20,
                            previous_page: null,
                            total_items: 1,
                            total_pages: 1,
                        },
                        projects: [
                            {
                                created_at: expect.any(String),
                                description: 'Description 1',
                                id: project.id,
                                name: 'Project 1',
                                metadata: {
                                    number_of_episodes: 0,
                                },
                            },
                        ],
                    })
                })
        })
        it('should return only the projects of the authenticated user', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const organization2 = await organizationService.create('Organization 2')
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            const user2 = await userService.create({
                email: 'user2@email.com',
                password: await authenticationService.hashPassword('password'),
                firstName: 'User',
                lastName: '2',
                organizationId: organization2.id,
            })
            await roleService.setUserRoles(user, [RoleName.ADMIN])
            await userService.confirmUser(user.id)
            const project = await projectService.create({
                userId: user.id,
                name: 'Project 1',
                description: 'Description 1',
            })
            await projectService.create({
                userId: user2.id,
                name: 'Project 2',
                description: 'Description 2',
            })
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .get('/projects')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        pagination: {
                            current_page: 1,
                            next_page: null,
                            per_page: 20,
                            previous_page: null,
                            total_items: 1,
                            total_pages: 1,
                        },
                        projects: [
                            {
                                created_at: expect.any(String),
                                description: 'Description 1',
                                id: project.id,
                                name: 'Project 1',
                                metadata: {
                                    number_of_episodes: 0,
                                },
                            },
                        ],
                    })
                })
        })
        it('should return an error if per_page is lower than 1', async () => {
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
            await request(app.getHttpServer())
                .get('/projects?per_page=0')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['per_page must not be less than 1'],
                        statusCode: 400,
                    })
                })
        })
        it('should return an error if page is lower than 1', async () => {
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
            await request(app.getHttpServer())
                .get('/projects?per_page=20&page=0')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: ['page must not be less than 1'],
                        statusCode: 400,
                    })
                })
        })
        it('should apply pagination', async () => {
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
            await projectService.create({
                userId: user.id,
                name: 'Project 1',
                description: 'Description 1',
            })
            const project2 = await projectService.create({
                userId: user.id,
                name: 'Project 2',
                description: 'Description 2',
            })
            const project3 = await projectService.create({
                userId: user.id,
                name: 'Project 3',
                description: 'Description 3',
            })
            const project4 = await projectService.create({
                userId: user.id,
                name: 'Project 4',
                description: 'Description 4',
            })
            const project5 = await projectService.create({
                userId: user.id,
                name: 'Project 5',
                description: 'Description 5',
            })
            const project6 = await projectService.create({
                userId: user.id,
                name: 'Project 6',
                description: 'Description 6',
            })
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .get('/projects?per_page=5')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        pagination: {
                            current_page: 1,
                            next_page: 2,
                            per_page: 5,
                            previous_page: null,
                            total_items: 6,
                            total_pages: 2,
                        },
                        projects: [
                            {
                                created_at: expect.any(String),
                                description: project6.description,
                                id: project6.id,
                                metadata: { number_of_episodes: 0 },
                                name: project6.name,
                            },
                            {
                                created_at: expect.any(String),
                                description: project5.description,
                                id: project5.id,
                                metadata: { number_of_episodes: 0 },
                                name: project5.name,
                            },
                            {
                                created_at: expect.any(String),
                                description: project4.description,
                                id: project4.id,
                                metadata: { number_of_episodes: 0 },
                                name: project4.name,
                            },
                            {
                                created_at: expect.any(String),
                                description: project3.description,
                                id: project3.id,
                                metadata: { number_of_episodes: 0 },
                                name: project3.name,
                            },
                            {
                                created_at: expect.any(String),
                                description: project2.description,
                                id: project2.id,
                                metadata: { number_of_episodes: 0 },
                                name: project2.name,
                            },
                        ],
                    })
                })
        })
        it('should apply pagination 2', async () => {
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
            await projectService.create({
                userId: user.id,
                name: 'Project 1',
                description: 'Description 1',
            })
            await projectService.create({
                userId: user.id,
                name: 'Project 2',
                description: 'Description 2',
            })
            await projectService.create({
                userId: user.id,
                name: 'Project 3',
                description: 'Description 3',
            })
            await projectService.create({
                userId: user.id,
                name: 'Project 4',
                description: 'Description 4',
            })
            await projectService.create({
                userId: user.id,
                name: 'Project 5',
                description: 'Description 5',
            })
            await projectService.create({
                userId: user.id,
                name: 'Project 6',
                description: 'Description 6',
            })
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .get('/projects?per_page=5&page=2')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({
                        pagination: {
                            current_page: 2,
                            next_page: null,
                            per_page: 5,
                            previous_page: 1,
                            total_items: 6,
                            total_pages: 2,
                        },
                        projects: [
                            {
                                created_at: expect.any(String),
                                description: 'Description 1',
                                id: expect.any(String),
                                metadata: { number_of_episodes: 0 },
                                name: 'Project 1',
                            },
                        ],
                    })
                })
        })
    })
    describe('/projects (POST)', () => {
        it('should return 401 if user is not authenticated', async () => {
            await request(app.getHttpServer()).post('/projects').expect(401)
        })
        it('should return an error if project name not provided', async () => {
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
            await request(app.getHttpServer())
                .post('/projects')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({
                    description: 'Description 1',
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: [
                            'name must be shorter than or equal to 255 characters',
                            'name must be a string',
                            'name should not be empty',
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
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.CREATE_PROJECT,
                    created_at: expect.any(Date),
                    error: '{"message":["name must be shorter than or equal to 255 characters","name must be a string","name should not be empty"],"error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: user.id,
                },
            ])
        })
        it('should return an error if user has a VIEVER role', async () => {
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
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/projects')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({
                    name: 'Project 1',
                    description: 'Description 1',
                })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Forbidden',
                        message: 'User does not have required roles to access this resource.',
                        statusCode: 403,
                    })
                })
        })
        it('should return an error if project with the same name already exists', async () => {
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
            await projectService.create({
                userId: user.id,
                name: 'Project 1',
                description: 'Description 1',
            })
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/projects')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({
                    name: 'Project 1',
                    description: 'Description 1',
                })
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: 'Project with the same name already exists',
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
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.CREATE_PROJECT,
                    created_at: expect.any(Date),
                    error: '{"message":"Project with the same name already exists","error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {},
                    status_code: 400,
                    user_id: user.id,
                },
            ])
        })
        it('should create a project', async () => {
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
            await request(app.getHttpServer())
                .post('/projects')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({
                    name: 'Project 1',
                    description: 'Description 1',
                })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            const project = await projectService.findAllByUserId(user.id)
            expect(project).toEqual([
                {
                    created_at: expect.any(Date),
                    updated_at: expect.any(Date),
                    deleted_at: null,
                    description: 'Description 1',
                    id: expect.any(String),
                    name: 'Project 1',
                    user_id: user.id,
                },
            ])
        })
        it('should create a project if the project name is the same but the user is different', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            const organization2 = await organizationService.create('Organization 2')
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            const user2 = await userService.create({
                email: 'user2@rmail.com',
                password: await authenticationService.hashPassword('password'),
                firstName: 'user',
                lastName: '2',
                organizationId: organization2.id,
            })
            await roleService.setUserRoles(user, [RoleName.ADMIN])
            await roleService.setUserRoles(user2, [RoleName.ADMIN])
            await userService.confirmUser(user.id)
            await userService.confirmUser(user2.id)
            await projectService.create({
                userId: user2.id,
                name: 'Project 1',
                description: 'Description 1',
            })
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .post('/projects')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({
                    name: 'Project 1',
                    description: 'Description 1',
                })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            const project = await projectService.findAllByUserId(user.id)
            expect(project).toEqual([
                {
                    created_at: expect.any(Date),
                    updated_at: expect.any(Date),
                    deleted_at: null,
                    description: 'Description 1',
                    id: expect.any(String),
                    name: 'Project 1',
                    user_id: user.id,
                },
            ])
        })
    })
    describe('/projects/:id (PATCH)', () => {
        it('should return 401 if user is not authenticated', async () => {
            await request(app.getHttpServer()).patch('/projects/1').expect(401)
        })
        it('should return 400 if id is not a valid UUID', async () => {
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
            await request(app.getHttpServer())
                .patch('/projects/invalid-uuid')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({})
                .expect(400)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Bad Request',
                        message: 'Validation failed (uuid is expected)',
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
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_PROJECT_DETAILS,
                    created_at: expect.any(Date),
                    error: '{"message":"Validation failed (uuid is expected)","error":"Bad Request","statusCode":400}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        id: 'invalid-uuid',
                    },
                    status_code: 400,
                    user_id: user.id,
                },
            ])
        })
        it('should return an error if user has a VIEVER role', async () => {
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
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .patch('/projects/1')
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({
                    name: 'Project 1',
                    description: 'Description 1',
                })
                .expect(403)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Forbidden',
                        message: 'User does not have required roles to access this resource.',
                        statusCode: 403,
                    })
                })
        })
        it('should return an error if project does not exist', async () => {
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
            const randomId = randomUUID()
            await request(app.getHttpServer())
                .patch(`/projects/${randomId}`)
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({})
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Not Found',
                        message: 'Project not found',
                        statusCode: 404,
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
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_PROJECT_DETAILS,
                    created_at: expect.any(Date),
                    error: '{"message":"Project not found","error":"Not Found","statusCode":404}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        id: randomId,
                    },
                    status_code: 404,
                    user_id: user.id,
                },
            ])
        })
        it('should return an error if project does not belong to the user', async () => {
            const organization = await organizationService.create(mockOrganizationEntity.name)
            await organizationService.create('Organization 2')
            const user = await userService.create({
                email: mockUserEntity.email,
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: organization.id,
            })
            const user2 = await userService.create({
                email: 'user2@gmail.com',
                password: await authenticationService.hashPassword(mockUserEntity.password),
                firstName: 'User',
                lastName: '2',
                organizationId: organization.id,
            })
            const project = await projectService.create({
                userId: user2.id,
                name: 'Project 1',
                description: 'Description 1',
            })
            await roleService.setUserRoles(user, [RoleName.ADMIN])
            await userService.confirmUser(user.id)
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .patch(`/projects/${project.id}`)
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({
                    name: 'Project 1',
                    description: 'Description 1',
                })
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: 'Not Found',
                        message: 'Project not found',
                        statusCode: 404,
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
                    parameters: { email: 'email@example.com' },
                    status_code: 200,
                    user_id: null,
                },
                {
                    action: AuditLogActionName.UPDATE_PROJECT_DETAILS,
                    created_at: expect.any(Date),
                    error: '{"message":"Project not found","error":"Not Found","statusCode":404}',
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        id: project.id,
                    },
                    status_code: 404,
                    user_id: user.id,
                },
            ])
        })
        it('should update a project', async () => {
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
            const project = await projectService.create({
                userId: user.id,
                name: 'Project',
                description: 'Description',
            })
            const authenticationResponse = await request(app.getHttpServer()).post('/auth/signin').send({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
            })
            await request(app.getHttpServer())
                .patch(`/projects/${project.id}`)
                .set('Authorization', `Bearer ${authenticationResponse.body.jwt_token}`)
                .send({
                    name: 'Updated Project',
                    description: 'Updated Description',
                })
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual({})
                })
            const updatedProject = await projectService.findById(project.id)
            expect(updatedProject).toEqual({
                created_at: expect.any(Date),
                updated_at: expect.any(Date),
                deleted_at: null,
                description: 'Updated Description',
                id: project.id,
                name: 'Updated Project',
                user_id: user.id,
            })
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
                    action: AuditLogActionName.UPDATE_PROJECT_DETAILS,
                    created_at: expect.any(Date),
                    error: null,
                    id: expect.any(String),
                    ip: expect.any(String),
                    parameters: {
                        id: project.id,
                    },
                    status_code: 200,
                    user_id: user.id,
                },
            ])
        })
    })
})
