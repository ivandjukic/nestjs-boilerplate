import { OrganizationService } from '../organization.service'
import { DataSource } from 'typeorm'
import { TestingModule, Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { OrganizationEntity } from '../entities/organization.entity'
import { mockOrganizationEntity } from './mocks/mockOrganizationEntity'

describe('Organization Service', () => {
    let service: OrganizationService
    let mockRepositorySaveFn: jest.Mock
    let mockRepositoryFindOneFn: jest.Mock
    let mockRepositoryUpdateFn: jest.Mock
    let dataSource: DataSource
    let mockCreateQueryRunnerFn: jest.Mock
    let mockSaveQueryRunnerFn: jest.Mock

    beforeEach(async () => {
        mockRepositorySaveFn = jest.fn()
        mockRepositoryFindOneFn = jest.fn()
        mockRepositoryUpdateFn = jest.fn()
        mockCreateQueryRunnerFn = jest.fn()
        mockSaveQueryRunnerFn = jest.fn()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganizationService,
                {
                    provide: getRepositoryToken(OrganizationEntity),
                    useValue: {
                        save: mockRepositorySaveFn,
                        findOne: mockRepositoryFindOneFn,
                        update: mockRepositoryUpdateFn,
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
        service = module.get(OrganizationService)
        dataSource = module.get(DataSource)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('create', () => {
        it('should save a user', async () => {
            mockRepositorySaveFn.mockReturnValueOnce(mockOrganizationEntity)
            const result = await service.create(mockOrganizationEntity.name)

            expect(result).toEqual(mockOrganizationEntity)
            expect(mockRepositorySaveFn).toHaveBeenCalledWith({
                name: mockOrganizationEntity.name,
            })
            expect(mockRepositorySaveFn).toHaveBeenCalledTimes(1)
        })
    })

    describe('createThreadSafe', () => {
        it('should save a user', async () => {
            const queryRunner = dataSource.createQueryRunner()
            mockSaveQueryRunnerFn.mockReturnValue(mockOrganizationEntity)
            const result = await service.createThreadSafe(mockOrganizationEntity.name, queryRunner)

            expect(result).toEqual(mockOrganizationEntity)
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledWith(OrganizationEntity, {
                name: mockOrganizationEntity.name,
            })
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledTimes(1)
        })
    })

    describe('findById', () => {
        it('should return null if organization is not found', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(null)
            const result = await service.findById(mockOrganizationEntity.id)
            expect(result).toBeNull()
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({ where: { id: mockOrganizationEntity.id } })
            expect(mockRepositoryFindOneFn).toHaveBeenCalledTimes(1)
        })
        it('should return organization if found', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockOrganizationEntity)
            const result = await service.findById(mockOrganizationEntity.id)
            expect(result).toEqual(mockOrganizationEntity)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({ where: { id: mockOrganizationEntity.id } })
            expect(mockRepositoryFindOneFn).toHaveBeenCalledTimes(1)
        })
    })
    describe('update', () => {
        it('should throw NotFoundException if organization is not found', async () => {
            const findByIdSpy = jest.spyOn(service, 'findById').mockResolvedValueOnce(null)
            await expect(service.update(mockOrganizationEntity.id, { name: 'new name' })).rejects.toThrowError()
            expect(findByIdSpy).toHaveBeenCalledWith(mockOrganizationEntity.id)
            expect(findByIdSpy).toHaveBeenCalledTimes(1)
        })
        it('should update organization details', async () => {
            const findByIdSpy = jest.spyOn(service, 'findById')
            findByIdSpy.mockResolvedValueOnce(mockOrganizationEntity as any)
            findByIdSpy.mockResolvedValueOnce({
                ...mockOrganizationEntity,
                name: 'updated name',
            } as any)
            mockRepositoryUpdateFn.mockReturnValueOnce(mockOrganizationEntity)
            const result = await service.update(mockOrganizationEntity.id, { name: 'updated name' })
            expect(result).toEqual({
                ...mockOrganizationEntity,
                name: 'updated name',
            })
            expect(findByIdSpy.mock.calls).toEqual([[mockOrganizationEntity.id], [mockOrganizationEntity.id]])
        })
        it('should update organization with current name if no new name is provided', async () => {
            const findByIdSpy = jest.spyOn(service, 'findById')
            findByIdSpy.mockResolvedValueOnce(mockOrganizationEntity as any)
            findByIdSpy.mockResolvedValueOnce({
                ...mockOrganizationEntity,
                name: mockOrganizationEntity.name,
            } as any)
            mockRepositoryUpdateFn.mockReturnValueOnce(mockOrganizationEntity)
            const result = await service.update(mockOrganizationEntity.id, {})
            expect(result).toEqual({
                ...mockOrganizationEntity,
                name: mockOrganizationEntity.name,
            })
            expect(findByIdSpy.mock.calls).toEqual([[mockOrganizationEntity.id], [mockOrganizationEntity.id]])
        })
    })
})
