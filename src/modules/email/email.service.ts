import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EnvVariableName } from '../../common/enums/EnvVariableName'
import { EmailModeTypes } from './enums/EmailModeTypes'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class EmailService {
    readonly emailMode

    constructor(
        private readonly configService: ConfigService,
        private readonly mailerService: MailerService,
    ) {
        this.emailMode =
            configService.getOrThrow<string>(EnvVariableName.EMAIL_MODE, EmailModeTypes.CONSOLE_LOG) ===
            EmailModeTypes.CONSOLE_LOG
                ? EmailModeTypes.CONSOLE_LOG
                : EmailModeTypes.SES
    }

    public async sendEmail(recipients: string[], body: string, subject: string): Promise<void> {
        switch (this.emailMode) {
            case EmailModeTypes.CONSOLE_LOG:
                console.log('### MOCK SENDING EMAIL - start ###')
                console.log(`To: ${recipients.toString()}`)
                console.log(`Subject: ${subject}`)
                console.log(`Body: ${body}`)
                console.log('### MOCK SENDING EMAIL - end ###')
                break
            case EmailModeTypes.SES:
                await this.mailerService.sendMail({
                    to: recipients,
                    subject: subject,
                    text: body,
                })
                break
            default:
                throw new Error(`Unknown email sender mode.`)
        }
    }
}
