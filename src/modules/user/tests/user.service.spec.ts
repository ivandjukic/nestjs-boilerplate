import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from '../user.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { UserEntity } from '../entities/user.entity'
import { mockUserEntity } from './mocks/mockUserEntity'
import { DataSource } from 'typeorm'
import { UserEntityRelation } from '../enums/UserEntityRelation'

describe('JwtService', () => {
    let service: UserService
    let mockRepositorySaveFn: jest.Mock
    let mockRepositoryFindOneFn: jest.Mock
    let mockFindAndCountFn: jest.Mock
    let mockRepositoryCountFn: jest.Mock
    let mockRepositoryUpdateFn: jest.Mock
    let dataSource: DataSource
    let mockCreateQueryRunnerFn: jest.Mock
    let mockSaveQueryRunnerFn: jest.Mock

    beforeEach(async () => {
        mockRepositorySaveFn = jest.fn()
        mockRepositoryFindOneFn = jest.fn()
        mockFindAndCountFn = jest.fn()
        mockRepositoryCountFn = jest.fn()
        mockRepositoryUpdateFn = jest.fn()
        mockCreateQueryRunnerFn = jest.fn()
        mockSaveQueryRunnerFn = jest.fn()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: {
                        save: mockRepositorySaveFn,
                        findOne: mockRepositoryFindOneFn,
                        findAndCount: mockFindAndCountFn,
                        update: mockRepositoryUpdateFn,
                        count: mockRepositoryCountFn,
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
        service = module.get(UserService)
        dataSource = module.get(DataSource)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('create', () => {
        it('should save a user', async () => {
            mockRepositorySaveFn.mockReturnValueOnce(mockUserEntity)
            const user = await service.create({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
                firstName: mockUserEntity.first_name,
                lastName: mockUserEntity.last_name,
                organizationId: mockUserEntity.organization_id,
            })

            expect(user).toEqual(mockUserEntity)
            expect(mockRepositorySaveFn).toHaveBeenCalledWith({
                email: mockUserEntity.email,
                password: mockUserEntity.password,
                first_name: mockUserEntity.first_name,
                last_name: mockUserEntity.last_name,
                organization_id: mockUserEntity.organization_id,
            })
            expect(mockRepositorySaveFn).toHaveBeenCalledTimes(1)
        })
    })

    describe('createThreadSafe', () => {
        it('should save a user', async () => {
            const queryRunner = dataSource.createQueryRunner()
            mockSaveQueryRunnerFn.mockReturnValue(mockUserEntity)
            const user = await service.createThreadSafe(
                {
                    email: mockUserEntity.email,
                    password: mockUserEntity.password,
                    firstName: mockUserEntity.first_name,
                    lastName: mockUserEntity.last_name,
                    organizationId: mockUserEntity.organization_id,
                },
                queryRunner,
            )

            expect(user).toEqual(mockUserEntity)
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledWith(UserEntity, {
                email: mockUserEntity.email,
                password: mockUserEntity.password,
                first_name: mockUserEntity.first_name,
                last_name: mockUserEntity.last_name,
                organization_id: mockUserEntity.organization_id,
            })
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledTimes(1)
        })
    })

    describe('findByEmail', () => {
        it('should return a user', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockUserEntity)
            const user = await service.findByEmail(mockUserEntity.email)
            expect(user).toEqual(mockUserEntity)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    email: mockUserEntity.email,
                },
                relations: [],
            })
        })

        it('should include relations', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockUserEntity)
            const user = await service.findByEmail(mockUserEntity.email, [UserEntityRelation.ORGANIZATION])
            expect(user).toEqual(mockUserEntity)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    email: mockUserEntity.email,
                },
                relations: [UserEntityRelation.ORGANIZATION],
            })
        })

        it('should return null if user not found', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(null)
            const user = await service.findByEmail(mockUserEntity.email)
            expect(user).toEqual(null)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    email: mockUserEntity.email,
                },
                relations: [],
            })
        })
    })

    describe('findById', () => {
        it('should return a user', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockUserEntity)
            const user = await service.findById(mockUserEntity.id)
            expect(user).toEqual(mockUserEntity)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    id: mockUserEntity.id,
                },
                relations: [],
            })
        })

        it('should include relations', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockUserEntity)
            const user = await service.findById(mockUserEntity.id, [
                UserEntityRelation.ORGANIZATION,
                UserEntityRelation.ROLES,
            ])
            expect(user).toEqual(mockUserEntity)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    id: mockUserEntity.id,
                },
                relations: [UserEntityRelation.ORGANIZATION, UserEntityRelation.ROLES],
            })
        })

        it('should return null if user not found', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(null)
            const user = await service.findById(mockUserEntity.id)
            expect(user).toEqual(null)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    id: mockUserEntity.id,
                },
                relations: [],
            })
        })
    })

    describe('findByIdWithDeleted', () => {
        it('should return a user', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockUserEntity)
            const user = await service.findByIdWithDeleted(mockUserEntity.id)
            expect(user).toEqual(mockUserEntity)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    id: mockUserEntity.id,
                },
                withDeleted: true,
            })
        })

        it('should return null if user not found', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(null)
            const user = await service.findByIdWithDeleted(mockUserEntity.id)
            expect(user).toEqual(null)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    id: mockUserEntity.id,
                },
                withDeleted: true,
            })
        })
    })

    describe('confirmUser', () => {
        it('should update a user', async () => {
            await service.confirmUser(mockUserEntity.id)
            expect(mockRepositoryUpdateFn).toBeCalledTimes(1)
            expect(mockRepositoryUpdateFn).toHaveBeenCalledWith(
                { id: mockUserEntity.id },
                { confirmed_at: expect.any(String) },
            )
        })
    })

    describe('getNumberOfUsers', () => {
        it('should return number of users', async () => {
            const count = 5
            mockRepositoryCountFn.mockReturnValueOnce(count)
            const result = await service.getNumberOfUsers()
            expect(result).toEqual(count)
            expect(mockRepositoryCountFn).toBeCalledTimes(1)
        })
    })

    describe('invalidatePasswordThreadSafe', () => {
        it('should update a user', async () => {
            const queryRunner = dataSource.createQueryRunner()
            await service.invalidatePasswordThreadSafe(mockUserEntity.id, queryRunner)
            expect(mockSaveQueryRunnerFn).toBeCalledTimes(1)
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledWith(UserEntity, {
                id: mockUserEntity.id,
                password: expect.any(String),
            })
        })
    })
    describe('setNewPassword', () => {
        it('should update a user', async () => {
            await service.setNewPassword(mockUserEntity.id, mockUserEntity.password)
            expect(mockRepositoryUpdateFn).toBeCalledTimes(1)
            expect(mockRepositoryUpdateFn).toHaveBeenCalledWith(
                { id: mockUserEntity.id },
                { password: expect.any(String) },
            )
        })
    })
})
