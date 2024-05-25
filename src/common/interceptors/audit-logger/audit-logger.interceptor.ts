import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { catchError, map, Observable } from 'rxjs'
import { Reflector } from '@nestjs/core'
import { AUDIT_LOG_ACTION_NAME_METADATA_KEY, AuditLogActionName } from '../../enums/AuditLogActionName'
import { AuditLogService } from '../../../modules/audit-logs/audit-log.service'

@Injectable()
export class AuditLoggerInterceptor implements NestInterceptor {
    constructor(
        private reflector: Reflector,
        private readonly auditLogService: AuditLogService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const { actionName, requestParamsToTrack }: { actionName: AuditLogActionName; requestParamsToTrack: string[] } =
            this.reflector.get<{ actionName: AuditLogActionName; requestParamsToTrack: string[] }>(
                AUDIT_LOG_ACTION_NAME_METADATA_KEY,
                context.getHandler(),
            )
        if (!actionName) {
            throw new Error('AuditLogActionName is required')
        }

        const httpContext = context.switchToHttp()
        const response = httpContext.getResponse()
        const ip = context.switchToHttp().getRequest().ip
        const userId = context.switchToHttp().getRequest().user?.id
        let parameters: Record<string, any> = {}
        requestParamsToTrack.forEach((param) => {
            parameters = {
                ...parameters,
                [param]:
                    context.switchToHttp().getRequest().params[param] ??
                    context.switchToHttp().getRequest().body[param],
            }
        })

        return next.handle().pipe(
            map(async (value) => {
                await this.auditLogService.save({
                    actionName,
                    statusCode: response.statusCode,
                    ip,
                    userId,
                    parameters,
                })
                return value
            }),
            catchError(async (error) => {
                await this.auditLogService.save({
                    actionName,
                    statusCode: error.response?.statusCode,
                    ip,
                    userId,
                    error: error.response,
                    parameters,
                })
                throw error
            }),
        )
    }
}
