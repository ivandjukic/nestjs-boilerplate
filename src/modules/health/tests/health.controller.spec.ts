import { Test, TestingModule } from '@nestjs/testing'
import { HealthController } from '../health.controller'
import { HealthService } from '../health.service'
import { mockServerHealthStatusOk } from './mocks/mockHealthStatus'

describe('healthController', () => {
    let controller: HealthController
    let mockCheckFn: jest.Mock

    beforeAll(async () => {
        mockCheckFn = jest.fn()

        const HealthControllerProvider = {
            provide: HealthService,
            useFactory: () => ({
                check: mockCheckFn,
            }),
        }

        const app: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [HealthControllerProvider],
        }).compile()
        controller = app.get(HealthController)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })

    describe('check', () => {
        it('should call HealthCheckService.check()', async () => {
            await controller.check()
            expect(mockCheckFn).toBeCalledTimes(1)
        })
        it('should return health status', async () => {
            mockCheckFn.mockReturnValueOnce(mockServerHealthStatusOk)
            const status = await controller.check()
            expect(status).toEqual(mockServerHealthStatusOk)
            expect(mockCheckFn).toBeCalledTimes(1)
        })
    })
})
