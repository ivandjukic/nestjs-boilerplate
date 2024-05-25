import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleEntity } from './entities/role.entity'
import { UserRoleEntity } from './entities/user-role.entity'
import { RoleService } from './role.service'

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([RoleEntity, UserRoleEntity])],
    providers: [RoleService],
    exports: [RoleService],
})
export class RoleModule {}
