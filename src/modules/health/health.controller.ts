import { ClassSerializerInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common'
import { HealthService } from './health.service'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SwaggerTag } from '../../common/enums/SwaggerTag'
import { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface'

@Controller('health')
@ApiTags(SwaggerTag.HEALTH)
@UseInterceptors(ClassSerializerInterceptor)
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get('/')
    @ApiOperation({ summary: 'Check health status' })
    public async check(): Promise<HealthCheckResult> {
        return await this.healthService.check()
    }
}
