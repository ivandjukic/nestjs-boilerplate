import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { ProjectService } from '../project.service'
import { ProjectEntity } from '../entities/project.entity'
import { mockProjectEntity } from './mocks/mockProjectEntity'
import { ProjectEntityRelation } from '../enums/ProjectEntityRelation'

describe('ProjectService', () => {
    let service: ProjectService
    let mockRepositorySaveFn: jest.Mock
    let mockRepositoryFindFn: jest.Mock
    let mockRepositoryFindOneFn: jest.Mock
    let mockRepositoryUpdateFn: jest.Mock
    let mockRepositoryFindAndCountFn: jest.Mock
    let dataSource: DataSource
    let mockCreateQueryRunnerFn: jest.Mock
    let mockSaveQueryRunnerFn: jest.Mock

    beforeEach(async () => {
        mockRepositorySaveFn = jest.fn()
        mockRepositoryFindFn = jest.fn()
        mockRepositoryFindOneFn = jest.fn()
        mockRepositoryUpdateFn = jest.fn()
        mockRepositoryFindAndCountFn = jest.fn()
        mockCreateQueryRunnerFn = jest.fn()
        mockSaveQueryRunnerFn = jest.fn()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectService,
                {
                    provide: getRepositoryToken(ProjectEntity),
                    useValue: {
                        save: mockRepositorySaveFn,
                        find: mockRepositoryFindFn,
                        findOne: mockRepositoryFindOneFn,
                        update: mockRepositoryUpdateFn,
                        findAndCount: mockRepositoryFindAndCountFn,
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: mockCreateQueryRunnerFn.mockReturnValueOnce({
                            manager: {
                                save: mockSaveQueryRunnerFn,
                            },
                        }),
                    },
                },
            ],
        }).compile()
        service = module.get(ProjectService)
        dataSource = module.get(DataSource)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('create', () => {
        it('should save a project', async () => {
            mockRepositorySaveFn.mockReturnValueOnce(mockProjectEntity)
            const result = await service.create({
                userId: mockProjectEntity.id,
                name: mockProjectEntity.name,
                description: mockProjectEntity.description,
            })
            expect(result).toEqual(mockProjectEntity)
            expect(mockRepositorySaveFn).toBeCalledWith({
                user_id: mockProjectEntity.id,
                name: mockProjectEntity.name,
                description: mockProjectEntity.description,
            })
        })

        it('should throw an error if a project with the same name already exists', async () => {
            mockRepositorySaveFn.mockRejectedValueOnce(new Error('Project with the same name already exists'))
            await expect(
                service.create({
                    userId: mockProjectEntity.id,
                    name: mockProjectEntity.name,
                    description: mockProjectEntity.description,
                }),
            ).rejects.toThrow('Project with the same name already exists')
            expect(mockRepositorySaveFn).toBeCalledWith({
                user_id: mockProjectEntity.id,
                name: mockProjectEntity.name,
                description: mockProjectEntity.description,
            })
        })
    })

    describe('createThreadSafe', () => {
        it('should save a project using a queryRunner', async () => {
            mockSaveQueryRunnerFn.mockReturnValueOnce(mockProjectEntity)
            const result = await service.createThreadSafe(
                {
                    userId: mockProjectEntity.id,
                    name: mockProjectEntity.name,
                    description: mockProjectEntity.description,
                },
                dataSource.createQueryRunner(),
            )
            expect(result).toEqual(mockProjectEntity)
            expect(mockSaveQueryRunnerFn).toBeCalledWith(ProjectEntity, {
                user_id: mockProjectEntity.id,
                name: mockProjectEntity.name,
                description: mockProjectEntity.description,
            })
        })
    })

    describe('findById', () => {
        it('should find a project by id', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockProjectEntity)
            const result = await service.findById(mockProjectEntity.id)
            expect(result).toEqual(mockProjectEntity)
            expect(mockRepositoryFindOneFn).toBeCalledWith({ where: { id: mockProjectEntity.id }, relations: [] })
        })
        it('should include relations if provided', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockProjectEntity)
            const result = await service.findById(mockProjectEntity.id, [ProjectEntityRelation.USER])
            expect(result).toEqual(mockProjectEntity)
            expect(mockRepositoryFindOneFn).toBeCalledWith({
                where: { id: mockProjectEntity.id },
                relations: [ProjectEntityRelation.USER],
            })
        })
        it('should return null if no project is found', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(null)
            const result = await service.findById(mockProjectEntity.id)
            expect(result).toBeNull()
            expect(mockRepositoryFindOneFn).toBeCalledWith({ where: { id: mockProjectEntity.id }, relations: [] })
        })
    })

    describe('findByUserId', () => {
        it('should find projects by user id', async () => {
            mockRepositoryFindAndCountFn.mockReturnValueOnce([[mockProjectEntity], 1])
            const result = await service.findByUserId(mockProjectEntity.id, { page: 1, per_page: 20 })
            expect(result).toEqual({
                projects: [mockProjectEntity],
                pagination: {
                    current_page: 1,
                    next_page: null,
                    per_page: 20,
                    previous_page: null,
                    total_items: 1,
                    total_pages: 1,
                },
            })
            expect(mockRepositoryFindAndCountFn).toBeCalledWith({
                skip: 0,
                take: 20,
                where: { user_id: mockProjectEntity.id },
                order: { created_at: 'DESC' },
            })
        })
        it('should return an empty array if no projects are found', async () => {
            mockRepositoryFindAndCountFn.mockReturnValueOnce([[], 0])
            const result = await service.findByUserId(mockProjectEntity.id, { page: 1, per_page: 20 })
            expect(result).toEqual({
                projects: [],
                pagination: {
                    current_page: 1,
                    next_page: null,
                    per_page: 20,
                    previous_page: null,
                    total_items: 0,
                    total_pages: 1,
                },
            })
            expect(mockRepositoryFindAndCountFn).toBeCalledWith({
                where: { user_id: mockProjectEntity.id },
                skip: 0,
                take: 20,
                order: { created_at: 'DESC' },
            })
        })
    })

    describe('findAllByUserId', () => {
        it('should find projects by user id', async () => {
            mockRepositoryFindFn.mockReturnValueOnce([mockProjectEntity])
            const result = await service.findAllByUserId(mockProjectEntity.id)
            expect(result).toEqual([mockProjectEntity])
            expect(mockRepositoryFindFn).toBeCalledWith({ where: { user_id: mockProjectEntity.id }, relations: [] })
        })
        it('should include relations if provided', async () => {
            mockRepositoryFindFn.mockReturnValueOnce([mockProjectEntity])
            const result = await service.findAllByUserId(mockProjectEntity.id, [ProjectEntityRelation.USER])
            expect(result).toEqual([mockProjectEntity])
            expect(mockRepositoryFindFn).toBeCalledWith({
                where: { user_id: mockProjectEntity.id },
                relations: [ProjectEntityRelation.USER],
            })
        })
        it('should return an empty array if no projects are found', async () => {
            mockRepositoryFindFn.mockReturnValueOnce([])
            const result = await service.findAllByUserId(mockProjectEntity.id)
            expect(result).toEqual([])
            expect(mockRepositoryFindFn).toBeCalledWith({ where: { user_id: mockProjectEntity.id }, relations: [] })
        })
    })

    describe('update', () => {
        it('should update a project', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockProjectEntity)
            await service.update({
                id: mockProjectEntity.id,
                userId: mockProjectEntity.user_id,
                name: mockProjectEntity.name,
                description: mockProjectEntity.description,
            })
            expect(mockRepositoryFindOneFn).toBeCalledWith({
                where: { id: mockProjectEntity.id, user_id: mockProjectEntity.user_id },
            })
            expect(mockRepositoryUpdateFn).toBeCalledWith(
                { id: mockProjectEntity.id },
                {
                    name: mockProjectEntity.name,
                    description: mockProjectEntity.description,
                },
            )
        })
        it('should throw an error if no project is found', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(null)
            await expect(
                service.update({
                    id: mockProjectEntity.id,
                    userId: mockProjectEntity.user_id,
                    name: mockProjectEntity.name,
                    description: mockProjectEntity.description,
                }),
            ).rejects.toThrow('Project not found')
            expect(mockRepositoryFindOneFn).toBeCalledWith({
                where: { id: mockProjectEntity.id, user_id: mockProjectEntity.user_id },
            })
            expect(mockRepositoryUpdateFn).not.toBeCalled()
        })
    })
})
