import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SwaggerTag } from '../../common/enums/SwaggerTag'
import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { UserService } from './user.service'
import { AuthenticationGuard } from '../../common/guards/authentication.guard'
import { User } from '../../common/decorators/User'
import { UserEntity } from './entities/user.entity'
import { UserResponseDto } from './dtos/user-response.dto'
import { RequiredRoles } from '../../common/decorators/RequiredRoles'
import { RoleName } from '../role/enums/RoleName'
import { UserRoleGuard } from '../../common/guards/user-role.guard'

@Controller('users')
@ApiTags(SwaggerTag.USER)
@UseGuards(AuthenticationGuard, UserRoleGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
    constructor(private readonly service: UserService) {}

    @Get('/authenticated-user')
    @ApiOperation({ summary: 'Get authenticated user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully retrieved authenticated user',
        type: UserResponseDto,
    })
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @RequiredRoles([RoleName.ADMIN, RoleName.EDITOR, RoleName.VIEWER])
    async signUpRequest(@User() user: UserEntity): Promise<UserResponseDto> {
        return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            created_at: user.created_at,
            organization: {
                id: user.organization.id,
                name: user.organization.name,
                created_at: user.organization.created_at,
            },
            roles: user.roles.map((role) => role.name),
        }
    }
}
