import { Test } from '@nestjs/testing'
import { HealthCheckService, TerminusModule } from '@nestjs/terminus'
import { HttpModule } from '@nestjs/axios'

import { mockServerHealthStatusOk } from './mocks/mockHealthStatus'
import { HealthService } from '../health.service'

describe('HealthService', () => {
    let service: HealthService
    let mockHealthCheckServiceCheckFn: jest.Mock

    beforeEach(async () => {
        mockHealthCheckServiceCheckFn = jest.fn()
        const module = await Test.createTestingModule({
            providers: [
                HealthService,
                {
                    provide: HealthCheckService,
                    useValue: {
                        check: mockHealthCheckServiceCheckFn,
                    },
                },
            ],
            imports: [TerminusModule, HttpModule],
        }).compile()
        service = await module.get(HealthService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('check', () => {
        it('should call HealthCheckService.check()', async () => {
            await service.check()
            expect(mockHealthCheckServiceCheckFn).toBeCalledTimes(1)
        })
        it('should return health status', async () => {
            mockHealthCheckServiceCheckFn.mockReturnValueOnce(mockServerHealthStatusOk)
            const status = await service.check()
            expect(status).toEqual(mockServerHealthStatusOk)
            expect(mockHealthCheckServiceCheckFn).toBeCalledTimes(1)
        })
    })
})
