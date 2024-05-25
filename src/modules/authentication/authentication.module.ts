import { Global, Module } from '@nestjs/common'
import { AuthenticationController } from './authentication.controller'
import { AuthenticationService } from './authentication.service'
import { EmailSenderModule } from '../email/email-sender.module'
import { ForgotPasswordRequestEntity } from '../forgot-password/entities/forgot-password.entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Global()
@Module({
    imports: [EmailSenderModule, TypeOrmModule.forFeature([ForgotPasswordRequestEntity])],
    controllers: [AuthenticationController],
    providers: [AuthenticationService],
    exports: [AuthenticationService],
})
export class AuthenticationModule {}
