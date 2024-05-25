import { Global, Module } from '@nestjs/common'
import { Logger, TypeOrmLogger } from './logger'

@Global()
@Module({
    imports: [],
    providers: [Logger, TypeOrmLogger],
    exports: [Logger, TypeOrmLogger],
})
export class LoggerModule {}
