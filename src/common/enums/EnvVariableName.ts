export enum EnvVariableName {
    PORT = 'PORT',
    ENV = 'ENV',
    POSTGRES_HOST = 'POSTGRES_HOST',
    POSTGRES_PORT = 'POSTGRES_PORT',
    POSTGRES_USER = 'POSTGRES_USER',
    POSTGRES_PASSWORD = 'POSTGRES_PASSWORD',
    POSTGRES_DATABASE = 'POSTGRES_DATABASE',
    RUN_MIGRATIONS = 'RUN_MIGRATIONS',
    TYPEORM_LOGGING = 'TYPEORM_LOGGING',
    WEB_APP_URL = 'WEB_APP_URL',
    PASSWORD_HASH_SALT = 'PASSWORD_HASH_SALT',
    PASSWORD_HASH_NUMBER_OF_ITERATIONS = 'PASSWORD_HASH_NUMBER_OF_ITERATIONS',
    JWT_SECRET = 'JWT_SECRET',
    JWT_TOKEN_EXPIRES_IN = 'JWT_TOKEN_EXPIRES_IN',
    JWT_REFRESH_TOKEN_EXPIRES_IN = 'JWT_REFRESH_TOKEN_EXPIRES_IN',
    ACCOUNT_CONFIRMATION_HASH_EXPIRES_IN = 'ACCOUNT_CONFIRMATION_HASH_EXPIRES_IN',
    EMAIL_MODE = 'EMAIL_MODE',
    AWS_ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID',
    AWS_SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY',
    AWS_REGION_NAME = 'AWS_REGION_NAME',
    AWS_EPISODES_BUCKET_NAME = 'AWS_EPISODES_BUCKET_NAME',
    SQS_QUEUE_URL = 'SQS_QUEUE_URL',
    AWS_S3_ENDPOINT = 'AWS_S3_ENDPOINT',
    AWS_S3_SIGNED_URL_EXPIRES_IN_SECONDS = 'AWS_S3_SIGNED_URL_EXPIRES_IN_SECONDS',
    AWS_BUCKET_TRANSCRIPTION_DATA = 'AWS_BUCKET_TRANSCRIPTION_DATA',
    OPENAI_API_KEY = 'OPENAI_API_KEY',
}
