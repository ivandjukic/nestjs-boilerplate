import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { RoleService } from '../role.service'
import { RoleEntity } from '../entities/role.entity'
import { UserRoleEntity } from '../entities/user-role.entity'
import { mockUserEntity } from '../../user/tests/mocks/mockUserEntity'
import { RoleName } from '../enums/RoleName'
import { mockRoleEntity } from './mocks/mockRoleEntity'

describe('Role Service', () => {
    let service: RoleService
    let mockRepositorySaveFn: jest.Mock
    let mockRepositoryFindFn: jest.Mock
    let mockRepositoryFindOneFn: jest.Mock
    let mockRepositoryRemoveFn: jest.Mock
    let dataSource: DataSource
    let mockCreateQueryRunnerFn: jest.Mock
    let mockSaveQueryRunnerFn: jest.Mock

    beforeEach(async () => {
        mockRepositorySaveFn = jest.fn()
        mockRepositoryFindFn = jest.fn()
        mockRepositoryFindOneFn = jest.fn()
        mockRepositoryRemoveFn = jest.fn()
        mockCreateQueryRunnerFn = jest.fn()
        mockSaveQueryRunnerFn = jest.fn()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                {
                    provide: getRepositoryToken(RoleEntity),
                    useValue: {
                        save: mockRepositorySaveFn,
                        find: mockRepositoryFindFn,
                        findOne: mockRepositoryFindOneFn,
                        remove: mockRepositoryRemoveFn,
                    },
                },
                {
                    provide: getRepositoryToken(UserRoleEntity),
                    useValue: {
                        save: mockRepositorySaveFn,
                        find: mockRepositoryFindFn,
                        findOne: mockRepositoryFindOneFn,
                        remove: mockRepositoryRemoveFn,
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
        service = module.get(RoleService)
        dataSource = module.get(DataSource)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('findByName', () => {
        it('should return a role', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(mockRoleEntity)
            const result = await service.findRoleByName(RoleName.ADMIN)
            expect(result).toEqual(mockRoleEntity)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    name: RoleName.ADMIN,
                },
            })
        })

        it('should return null if role not found', async () => {
            mockRepositoryFindOneFn.mockReturnValueOnce(null)
            const result = await service.findRoleByName(RoleName.ADMIN)
            expect(result).toEqual(null)
            expect(mockRepositoryFindOneFn).toBeCalledTimes(1)
            expect(mockRepositoryFindOneFn).toHaveBeenCalledWith({
                where: {
                    name: RoleName.ADMIN,
                },
            })
        })
    })

    describe('findAllByUserId', () => {
        it('should an array of roles', async () => {
            mockRepositoryFindFn.mockReturnValueOnce([mockRoleEntity])
            const result = await service.findAllByUserId(mockUserEntity.id)
            expect(result).toEqual([mockRoleEntity])
            expect(mockRepositoryFindFn).toBeCalledTimes(1)
            expect(mockRepositoryFindFn).toHaveBeenCalledWith({
                where: {
                    user_id: mockUserEntity.id,
                },
            })
        })
    })

    describe('updateUserRoles', () => {
        it('should update user roles successfully', async () => {
            const revokeAllRolesByUserIdSpy = jest.spyOn(service as any, 'revokeAllRolesByUserId')
            const findRoleByNameSpy = jest.spyOn(service as any, 'findRoleByName')
            findRoleByNameSpy.mockReturnValueOnce(mockRoleEntity)
            await service.updateUserRoles(mockUserEntity, [RoleName.ADMIN])
            expect(revokeAllRolesByUserIdSpy).toHaveBeenCalledTimes(1)
            expect(revokeAllRolesByUserIdSpy).toHaveBeenCalledWith(mockUserEntity.id)
            expect(findRoleByNameSpy).toHaveBeenCalledTimes(1)
            expect(findRoleByNameSpy).toHaveBeenCalledWith(RoleName.ADMIN)
            expect(mockRepositorySaveFn).toHaveBeenCalledTimes(1)
            expect(mockRepositorySaveFn).toHaveBeenCalledWith({
                user_id: mockUserEntity.id,
                role_id: mockRoleEntity.id,
            })
        })

        it('should work with multiple roles', async () => {
            const revokeAllRolesByUserIdSpy = jest.spyOn(service as any, 'revokeAllRolesByUserId')
            const findRoleByNameSpy = jest.spyOn(service as any, 'findRoleByName')
            findRoleByNameSpy.mockReturnValueOnce({
                ...mockRoleEntity,
                id: 'role-id-1',
                name: RoleName.ADMIN,
            })
            findRoleByNameSpy.mockReturnValueOnce({
                ...mockRoleEntity,
                id: 'role-id-2',
                name: RoleName.EDITOR,
            })
            findRoleByNameSpy.mockReturnValueOnce(mockRoleEntity)
            await service.updateUserRoles(mockUserEntity, [RoleName.ADMIN, RoleName.EDITOR])
            expect(revokeAllRolesByUserIdSpy).toHaveBeenCalledTimes(1)
            expect(revokeAllRolesByUserIdSpy).toHaveBeenCalledWith(mockUserEntity.id)
            expect(findRoleByNameSpy).toHaveBeenCalledTimes(2)
            expect(findRoleByNameSpy.mock.calls).toEqual([[RoleName.ADMIN], [RoleName.EDITOR]])
            expect(mockRepositorySaveFn).toHaveBeenCalledTimes(2)
            expect(mockRepositorySaveFn.mock.calls).toEqual([
                [
                    {
                        user_id: mockUserEntity.id,
                        role_id: 'role-id-1',
                    },
                ],
                [
                    {
                        user_id: mockUserEntity.id,
                        role_id: 'role-id-2',
                    },
                ],
            ])
        })
    })

    describe('setUserRolesThreadSafe', () => {
        it('should update user roles successfully', async () => {
            const findRoleByNameSpy = jest.spyOn(service as any, 'findRoleByName')
            findRoleByNameSpy.mockReturnValueOnce(mockRoleEntity)
            await service.setUserRolesThreadSafe(mockUserEntity, [RoleName.ADMIN], dataSource.createQueryRunner())
            expect(findRoleByNameSpy).toHaveBeenCalledTimes(1)
            expect(findRoleByNameSpy).toHaveBeenCalledWith(RoleName.ADMIN)
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledTimes(1)
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledWith(UserRoleEntity, {
                user_id: mockUserEntity.id,
                role_id: mockRoleEntity.id,
            })
        })

        it('should work with multiple roles', async () => {
            const findRoleByNameSpy = jest.spyOn(service as any, 'findRoleByName')
            findRoleByNameSpy.mockReturnValueOnce({
                ...mockRoleEntity,
                id: 'role-id-1',
                name: RoleName.ADMIN,
            })
            findRoleByNameSpy.mockReturnValueOnce({
                ...mockRoleEntity,
                id: 'role-id-2',
                name: RoleName.EDITOR,
            })
            await service.setUserRolesThreadSafe(
                mockUserEntity,
                [RoleName.ADMIN, RoleName.EDITOR],
                dataSource.createQueryRunner(),
            )
            expect(findRoleByNameSpy).toHaveBeenCalledTimes(2)
            expect(findRoleByNameSpy.mock.calls).toEqual([[RoleName.ADMIN], [RoleName.EDITOR]])
            expect(mockSaveQueryRunnerFn).toHaveBeenCalledTimes(2)
            expect(mockSaveQueryRunnerFn.mock.calls).toEqual([
                [
                    UserRoleEntity,
                    {
                        user_id: mockUserEntity.id,
                        role_id: 'role-id-1',
                    },
                ],
                [
                    UserRoleEntity,
                    {
                        user_id: mockUserEntity.id,
                        role_id: 'role-id-2',
                    },
                ],
            ])
        })
    })

    describe('setUserRoles', () => {
        it('should update user roles successfully', async () => {
            const findRoleByNameSpy = jest.spyOn(service as any, 'findRoleByName')
            const revokeAllRolesByUserIdSpy = jest.spyOn(service as any, 'revokeAllRolesByUserId')
            findRoleByNameSpy.mockReturnValueOnce(mockRoleEntity)
            await service.setUserRoles(mockUserEntity, [RoleName.ADMIN])
            expect(findRoleByNameSpy).toHaveBeenCalledTimes(1)
            expect(findRoleByNameSpy).toHaveBeenCalledWith(RoleName.ADMIN)
            expect(mockRepositorySaveFn).toHaveBeenCalledTimes(1)
            expect(mockRepositorySaveFn).toHaveBeenCalledWith({
                user_id: mockUserEntity.id,
                role_id: mockRoleEntity.id,
            })
            expect(revokeAllRolesByUserIdSpy).toHaveBeenCalledTimes(1)
            expect(revokeAllRolesByUserIdSpy).toHaveBeenCalledWith(mockUserEntity.id)
        })

        it('should work with multiple roles', async () => {
            const findRoleByNameSpy = jest.spyOn(service as any, 'findRoleByName')
            const revokeAllRolesByUserIdSpy = jest.spyOn(service as any, 'revokeAllRolesByUserId')
            findRoleByNameSpy.mockReturnValueOnce({
                ...mockRoleEntity,
                id: 'role-id-1',
                name: RoleName.ADMIN,
            })
            findRoleByNameSpy.mockReturnValueOnce({
                ...mockRoleEntity,
                id: 'role-id-2',
                name: RoleName.EDITOR,
            })
            await service.setUserRoles(mockUserEntity, [RoleName.ADMIN, RoleName.EDITOR])
            expect(findRoleByNameSpy).toHaveBeenCalledTimes(2)
            expect(findRoleByNameSpy.mock.calls).toEqual([[RoleName.ADMIN], [RoleName.EDITOR]])
            expect(mockRepositorySaveFn).toHaveBeenCalledTimes(2)
            expect(mockRepositorySaveFn.mock.calls).toEqual([
                [
                    {
                        user_id: mockUserEntity.id,
                        role_id: 'role-id-1',
                    },
                ],
                [
                    {
                        user_id: mockUserEntity.id,
                        role_id: 'role-id-2',
                    },
                ],
            ])
            expect(revokeAllRolesByUserIdSpy).toHaveBeenCalledTimes(1)
            expect(revokeAllRolesByUserIdSpy).toHaveBeenCalledWith(mockUserEntity.id)
        })
    })
})
