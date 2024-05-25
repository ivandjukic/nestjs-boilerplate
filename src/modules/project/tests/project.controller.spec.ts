import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../user/user.service'
import { ProjectController } from '../project.controller'
import { ProjectService } from '../project.service'
import { mockUserEntity } from '../../user/tests/mocks/mockUserEntity'
import { mockProjectEntity } from './mocks/mockProjectEntity'
import { ProjectWithTheSameNameAlreadyExists } from '../errors/ProjectWithTheSameNameAlreadyExists'
import { BadRequestException } from '@nestjs/common'
import { AuditLogService } from '../../audit-logs/audit-log.service'

describe('ProjectController', () => {
    let controller: ProjectController
    let mockFindByUserIdFn: jest.Mock
    let mockCreateProjectFn: jest.Mock
    let mockUpdateProjectFn: jest.Mock

    beforeAll(async () => {
        mockFindByUserIdFn = jest.fn()
        mockCreateProjectFn = jest.fn()
        mockUpdateProjectFn = jest.fn()

        const ProjectControllerProvider = {
            provide: ProjectService,
            useFactory: () => ({
                findByUserId: mockFindByUserIdFn,
                create: mockCreateProjectFn,
                update: mockUpdateProjectFn,
            }),
        }

        const app: TestingModule = await Test.createTestingModule({
            controllers: [ProjectController],
            providers: [
                ProjectControllerProvider,
                { provide: UserService, useFactory: () => {} },
                {
                    provide: ConfigService,
                    useFactory: () => {},
                },
                {
                    provide: AuditLogService,
                    useFactory: () => {},
                },
            ],
        }).compile()
        controller = app.get(ProjectController)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })

    describe('getProjectsByUserId', () => {
        it('should return projects', async () => {
            mockFindByUserIdFn.mockResolvedValue({
                pagination: { page: 1, per_page: 20, total: 1 },
                projects: [mockProjectEntity],
            })
            const data = await controller.getProjectsByUserId(mockUserEntity, { page: 1, per_page: 20 })
            expect(data).toEqual({
                pagination: { page: 1, per_page: 20, total: 1 },
                projects: [
                    {
                        id: mockProjectEntity.id,
                        name: mockProjectEntity.name,
                        description: mockProjectEntity.description,
                        created_at: mockProjectEntity.created_at,
                        metadata: { number_of_episodes: 0 },
                    },
                ],
            })
        })
        it('should return number of episodes', async () => {
            mockFindByUserIdFn.mockResolvedValue({
                pagination: { page: 1, per_page: 20, total: 1 },
                projects: [mockProjectEntity],
            })
            const data = await controller.getProjectsByUserId(mockUserEntity, { page: 1, per_page: 20 })
            expect(data).toEqual({
                pagination: { page: 1, per_page: 20, total: 1 },
                projects: [
                    {
                        id: mockProjectEntity.id,
                        name: mockProjectEntity.name,
                        description: mockProjectEntity.description,
                        created_at: mockProjectEntity.created_at,
                        metadata: { number_of_episodes: 0 },
                    },
                ],
            })
        })
    })

    describe('createProject', () => {
        it('should create a project', async () => {
            mockCreateProjectFn.mockResolvedValue(undefined)
            await controller.createProject(mockUserEntity, {
                name: mockProjectEntity.name,
                description: mockProjectEntity.description,
            })
            expect(mockCreateProjectFn).toHaveBeenCalledWith({
                userId: mockUserEntity.id,
                name: mockProjectEntity.name,
                description: mockProjectEntity.description,
            })
        })
        it('should handle ProjectWithTheSameNameAlreadyExists error', async () => {
            mockCreateProjectFn.mockRejectedValue(new ProjectWithTheSameNameAlreadyExists())
            await expect(
                controller.createProject(mockUserEntity, {
                    name: mockProjectEntity.name,
                    description: mockProjectEntity.description,
                }),
            ).rejects.toThrow(BadRequestException)
        })
        it('should handle other errors', async () => {
            mockCreateProjectFn.mockRejectedValue(new Error())
            await expect(
                controller.createProject(mockUserEntity, {
                    name: mockProjectEntity.name,
                    description: mockProjectEntity.description,
                }),
            ).rejects.toThrow(Error)
        })
    })
    describe('updateProject', () => {
        it('should update a project', async () => {
            mockUpdateProjectFn.mockResolvedValue(undefined)
            await controller.updateProject(
                mockUserEntity,
                {
                    name: mockProjectEntity.name,
                    description: mockProjectEntity.description,
                },
                mockProjectEntity.id,
            )
            expect(mockUpdateProjectFn).toHaveBeenCalledWith({
                id: mockProjectEntity.id,
                userId: mockUserEntity.id,
                name: mockProjectEntity.name,
                description: mockProjectEntity.description,
            })
        })
    })
})
