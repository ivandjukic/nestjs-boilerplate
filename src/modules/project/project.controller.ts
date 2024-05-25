import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SwaggerTag } from '../../common/enums/SwaggerTag'
import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Query,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { AuthenticationGuard } from '../../common/guards/authentication.guard'
import { RequiredRoles } from '../../common/decorators/RequiredRoles'
import { RoleName } from '../role/enums/RoleName'
import { UserRoleGuard } from '../../common/guards/user-role.guard'
import { ProjectService } from './project.service'
import { PaginationQueryRequestDto } from '../../common/dtos/pagination-query-request.dto'
import { ProjectsResponseDto } from './dtos/projects-response.dto'
import { User } from '../../common/decorators/User'
import { UserEntity } from '../user/entities/user.entity'
import { EmptyResponseDto } from '../../common/dtos/EmptyResponseDto'
import { CreateProjectRequestDto } from './dtos/create-project-request.dto'
import { ProjectWithTheSameNameAlreadyExists } from './errors/ProjectWithTheSameNameAlreadyExists'
import { UpdateProjectRequestDto } from './dtos/update-project-request.dto'
import { ParamValidUUID } from '../../common/decorators/ParamValidUUID'
import { AuditLoggerInterceptor } from '../../common/interceptors/audit-logger/audit-logger.interceptor'
import { SetAuditLogActionName } from '../../common/decorators/AuditLogActionName'
import { AuditLogActionName } from '../../common/enums/AuditLogActionName'

@Controller('projects')
@ApiTags(SwaggerTag.PROJECT)
@UseGuards(AuthenticationGuard, UserRoleGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProjectController {
    constructor(private readonly service: ProjectService) {}

    @Get('/')
    @ApiOperation({ summary: "Get user's projects" })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully retrieved projects',
        type: ProjectsResponseDto,
    })
    @ApiQuery({ type: PaginationQueryRequestDto })
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @RequiredRoles([RoleName.ADMIN, RoleName.EDITOR, RoleName.VIEWER])
    async getProjectsByUserId(
        @User() user: UserEntity,
        @Query() query: PaginationQueryRequestDto,
    ): Promise<ProjectsResponseDto> {
        const data = await this.service.findByUserId(user.id, query)
        return {
            ...data,
            projects: data.projects.map((project) => ({
                id: project.id,
                name: project.name,
                description: project.description,
                created_at: project.created_at,
                metadata: {
                    number_of_episodes: 0,
                },
            })),
        }
    }

    @Post('/')
    @ApiOperation({ summary: 'Create a project' })
    @ApiBody({ type: CreateProjectRequestDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully created a project',
        type: EmptyResponseDto,
    })
    @ApiBearerAuth()
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Project with the same name already exists' })
    @HttpCode(HttpStatus.OK)
    @RequiredRoles([RoleName.ADMIN, RoleName.EDITOR])
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.CREATE_PROJECT)
    async createProject(@User() user: UserEntity, @Body() payload: CreateProjectRequestDto): Promise<void> {
        try {
            await this.service.create({
                userId: user.id,
                name: payload.name,
                description: payload.description,
            })
        } catch (error) {
            if (error instanceof ProjectWithTheSameNameAlreadyExists) {
                throw new BadRequestException('Project with the same name already exists')
            }
            throw error
        }
    }

    @Patch('/:id')
    @ApiOperation({ summary: 'Update a project' })
    @ApiBody({ type: UpdateProjectRequestDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully updated a project',
        type: EmptyResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project Not Found' })
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @RequiredRoles([RoleName.ADMIN, RoleName.EDITOR])
    @UseInterceptors(AuditLoggerInterceptor)
    @SetAuditLogActionName(AuditLogActionName.UPDATE_PROJECT_DETAILS, ['id'])
    async updateProject(
        @User() user: UserEntity,
        @Body() payload: UpdateProjectRequestDto,
        @ParamValidUUID('id') id: string,
    ): Promise<void> {
        await this.service.update({
            id,
            userId: user.id,
            name: payload.name,
            description: payload.description,
        })
    }
}
