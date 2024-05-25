import { Global, Module } from '@nestjs/common'
import { ProjectService } from './project.service'
import { ProjectController } from './project.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectEntity } from './entities/project.entity'

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([ProjectEntity])],
    providers: [ProjectService],
    exports: [ProjectService],
    controllers: [ProjectController],
})
export class ProjectModule {}
