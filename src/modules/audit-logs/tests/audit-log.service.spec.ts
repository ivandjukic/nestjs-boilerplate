import { Test, TestingModule } from '@nestjs/testing'
import { AuditLogService } from '../audit-log.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { AuditLogEntity } from '../entities/audit-log.entity'
import { AuditLogActionName } from '../../../common/enums/AuditLogActionName'
import { mockAuditLogEntity } from './mocks/mockAuditLogEntity'

describe('AuditLogService', () => {
    let service: AuditLogService
    // AuditLogEntity - Repository
    let mockRepositorySaveFn: jest.Mock
    let mockRepositoryFindFn: jest.Mock

    beforeEach(async () => {
        // EpisodeEntity - Repository
        mockRepositorySaveFn = jest.fn()
        mockRepositoryFindFn = jest.fn()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditLogService,
                {
                    provide: getRepositoryToken(AuditLogEntity),
                    useValue: {
                        save: mockRepositorySaveFn,
                        find: mockRepositoryFindFn,
                    },
                },
            ],
        }).compile()
        service = module.get(AuditLogService)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('save', () => {
        it('should save audit log', async () => {
            const data = {
                actionName: AuditLogActionName.SIGN_UP,
                ip: '127.0.0.1',
                statusCode: 200,
                error: 'error',
                userId: '1',
                resourceId: 'string',
                parameters: { key: 'value' },
            }
            await service.save(data)
            expect(mockRepositorySaveFn).toBeCalledWith({
                action: data.actionName,
                ip: data.ip,
                status_code: data.statusCode,
                user_id: data.userId,
                error: data.error,
                parameters: data.parameters,
            })
        })
    })
    describe('getAll', () => {
        it('should return all audit logs', async () => {
            mockRepositoryFindFn.mockResolvedValueOnce([mockAuditLogEntity])
            const data = await service.getAll()
            expect(mockRepositoryFindFn).toBeCalledWith({ order: { created_at: 'ASC' } })
            expect(data).toEqual([mockAuditLogEntity])
        })
    })
})
