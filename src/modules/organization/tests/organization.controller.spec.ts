import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../user/user.service'
import { OrganizationController } from '../organization.controller'
import { OrganizationService } from '../organization.service'
import { mockUserEntity } from '../../user/tests/mocks/mockUserEntity'
import { NotFoundException } from '@nestjs/common'
import { AuditLogService } from '../../audit-logs/audit-log.service'

describe('OrganizationController', () => {
    let controller: OrganizationController
    let mockUpdate: jest.Mock

    beforeAll(async () => {
        mockUpdate = jest.fn()

        const OrganizationControllerProvider = {
            provide: OrganizationService,
            useFactory: () => ({
                update: mockUpdate,
            }),
        }

        const app: TestingModule = await Test.createTestingModule({
            controllers: [OrganizationController],
            providers: [
                OrganizationControllerProvider,
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
        controller = app.get(OrganizationController)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
    describe('getOrganizationDetails', () => {
        it('should return organization details', async () => {
            const result = await controller.getOrganizationDetails(mockUserEntity)
            expect(result).toEqual({
                id: mockUserEntity.organization.id,
                name: mockUserEntity.organization.name,
                created_at: mockUserEntity.organization.created_at,
            })
        })
    })
    describe('updateOrganization', () => {
        it('should throw an error if no organization is found', async () => {
            mockUpdate.mockRejectedValueOnce(new NotFoundException())
            await expect(
                controller.updateOrganization(mockUserEntity, {
                    name: 'new name',
                }),
            ).rejects.toThrow(NotFoundException)
            expect(mockUpdate).toHaveBeenCalledWith(mockUserEntity.organization.id, {
                name: 'new name',
            })
        })
        it('should return the updated organization', async () => {
            const updatedOrganization = {
                id: mockUserEntity.organization.id,
                name: 'new name',
                created_at: mockUserEntity.organization.created_at,
            }
            mockUpdate.mockResolvedValueOnce(updatedOrganization)
            const result = await controller.updateOrganization(mockUserEntity, {
                name: 'new name',
            })
            expect(result).toEqual(updatedOrganization)
            expect(mockUpdate).toHaveBeenCalledWith(mockUserEntity.organization.id, {
                name: 'new name',
            })
        })
    })
})
