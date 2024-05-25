import { ArgumentsHost, Catch, ExceptionFilter, HttpException, LoggerService } from '@nestjs/common'
import { Request, Response } from 'express'
// import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(
        // @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logService: LoggerService,
    ) {}

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()
        const status = exception.getStatus()

        this.logService.log({ message: exception.message, body: { status, exception, request, response } })

        response.status(status).json(exception.getResponse())
    }
}
