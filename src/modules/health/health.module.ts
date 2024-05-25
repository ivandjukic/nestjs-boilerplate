import { Global, Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'
import { ClsModule } from 'nestjs-cls'
import { HttpModule } from '@nestjs/axios'
import { TerminusModule } from '@nestjs/terminus'

@Global()
@Module({
    imports: [TerminusModule, HttpModule, ClsModule],
    controllers: [HealthController],
    providers: [HealthService],
    exports: [HealthService],
})
export class HealthModule {}
