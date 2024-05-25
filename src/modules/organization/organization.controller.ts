import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { SwaggerTag } from '../../common/enums/SwaggerTag'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthenticationGuard } from '../../common/guards/authentication.guard'
import { UserRoleGuard } from '../../common/guards/user-role.guard'
import { OrganizationService } from './organization.service'
import { RequiredRoles } from '../../common/decorators/RequiredRoles'
import { RoleName } from '../role/enums/RoleName'
import { User } from '../../common/decorators/User'
import { OrganizationDto } from './dtos/organization.dto'
import { UserEntity } from '../user/entities/user.entity'
import { UpdateOrganizationDetailsRequestDto } from './dtos/update-organization-details-request.dto'
import { AuditLoggerInterceptor } from '../../common/interceptors/audit-logger/audit-logger.interceptor'
import { SetAuditLogActionName } from '../../common/decorators/AuditLogActionName'
import { AuditLogActionName } from '../../common/enums/AuditLogActionName'

@Controller('organizations')
@ApiTags(SwaggerTag.ORGANIZATION)
@UseGuards(AuthenticationGuard, UserRoleGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class OrganizationController {
    constructor(private readonly service: OrganizationService) {}

    @Get('/')
    @ApiOperation({ summary: 'Get organization details' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully retrieved organization details',
        type: OrganizationDto,
    })
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @RequiredRoles([RoleName.ADMIN, RoleName.EDITOR, RoleName.VIEWER])
    async getOrganizationDetails(@User() user: UserEntity): Promise<OrganizationDto> {
        return {
            id: user.organization.id,
            name: user.organization.name,
            created_at: user.organization.created_at,
        }
    }

    @Patch('/')
    @ApiOperation({ summary: 'Update organization details' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully updated organization details',
        type: OrganizationDto,
    })
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiBody({ type: UpdateOrganizationDetailsRequestDto })
    @RequiredRoles([RoleName.ADMIN])
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.UPDATE_ORGANIZATION_DETAILS, ['name'])
    async updateOrganization(
        @User() user: UserEntity,
        @Body() payload: UpdateOrganizationDetailsRequestDto,
    ): Promise<OrganizationDto> {
        return this.service.update(user.organization_id, payload)
    }
}
