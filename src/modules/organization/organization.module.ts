import { Global, Module } from '@nestjs/common'
import { OrganizationService } from './organization.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrganizationEntity } from './entities/organization.entity'
import { OrganizationController } from './organization.controller'

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([OrganizationEntity])],
    controllers: [OrganizationController],
    providers: [OrganizationService],
    exports: [OrganizationService],
})
export class OrganizationModule {}
