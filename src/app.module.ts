import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface'
import { AuthenticationModule } from './modules/authentication/authentication.module'
import { EnvVariableName } from './common/enums/EnvVariableName'
import { isConfigParameterEnabled } from './common/utils/isConfigParameterEnabled'
import { UserModule } from './modules/user/user.module'
import { EmailSenderModule } from './modules/email/email-sender.module'
import { JwtModule } from './modules/jwt/jwt.module'
import { OrganizationModule } from './modules/organization/organization.module'
import { OrganizationEntity } from './modules/organization/entities/organization.entity'
import { UserEntity } from './modules/user/entities/user.entity'
import { RoleEntity } from './modules/role/entities/role.entity'
import { UserRoleEntity } from './modules/role/entities/user-role.entity'
import { RoleModule } from './modules/role/role.module'
import { LoggerModule } from './modules/logger/logger.module'
import { TypeOrmLogger } from './modules/logger/logger'
import { ProjectModule } from './modules/project/project.module'
import { ProjectEntity } from './modules/project/entities/project.entity'
import { HealthModule } from './modules/health/health.module'
import { MailerModule } from '@nestjs-modules/mailer'
import { ForgotPasswordRequestEntity } from './modules/forgot-password/entities/forgot-password.entity'
import { AppEnv } from './common/enums/AppEnv'
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module'
import { AuditLogEntity } from './modules/audit-logs/entities/audit-log.entity'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            // @TODO Fix this
            envFilePath: process.env.ENV === AppEnv.INTEGRATION_TEST ? '.env.integrationtest-local' : '.env',
        }),
        TypeOrmModule.forRootAsync({
            name: 'default',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return {
                    type: 'postgres',
                    host: configService.getOrThrow(EnvVariableName.POSTGRES_HOST),
                    port: configService.getOrThrow(EnvVariableName.POSTGRES_PORT),
                    username: configService.get(EnvVariableName.POSTGRES_USER),
                    password: configService.get(EnvVariableName.POSTGRES_PASSWORD),
                    database: configService.get(EnvVariableName.POSTGRES_DATABASE),
                    ssl:
                        configService.get(EnvVariableName.ENV) === AppEnv.LOCAL ||
                        configService.get(EnvVariableName.ENV) === AppEnv.INTEGRATION_TEST
                            ? false
                            : true,
                    extra:
                        configService.get(EnvVariableName.ENV) === AppEnv.LOCAL ||
                        configService.get(EnvVariableName.ENV) === AppEnv.INTEGRATION_TEST
                            ? undefined
                            : {
                                  ssl: {
                                      rejectUnauthorized: false,
                                  },
                              },
                    entities: [
                        OrganizationEntity,
                        UserEntity,
                        RoleEntity,
                        UserRoleEntity,
                        ProjectEntity,
                        ForgotPasswordRequestEntity,
                        AuditLogEntity,
                    ],
                    synchronize: isConfigParameterEnabled(
                        configService.getOrThrow<'true' | 'false'>(EnvVariableName.RUN_MIGRATIONS),
                    ),
                    logging: isConfigParameterEnabled(
                        configService.getOrThrow<'true' | 'false'>(EnvVariableName.TYPEORM_LOGGING),
                    ),
                    connectTimeoutMS: 30000,
                    logger: new TypeOrmLogger(),
                } as TypeOrmModuleOptions
            },
        }),
        MailerModule.forRoot({
            transport: {
                host: 'email-smtp.eu-central-1.amazonaws.com', // Replace [region] with your AWS SES region.
                secure: false, // True if you're using port 465, false for port 587 or 25.
                auth: {
                    user: 'AKIA5FTZFUYY5OQLUN55', // Your SMTP username from AWS SES.
                    pass: 'BIUVcC0Ib8xFiXyIQl1j56zCGO6bk5ufNh2Q2ejs/S3u', // Your SMTP password from AWS SES.
                },
            },
            defaults: {
                from: '"No Reply" email@example.com',
            },
        }),
        AuthenticationModule,
        UserModule,
        EmailSenderModule,
        JwtModule,
        OrganizationModule,
        RoleModule,
        LoggerModule,
        ProjectModule,
        HealthModule,
        AuditLogsModule,
    ],
    controllers: [],
})
export class AppModule {}
