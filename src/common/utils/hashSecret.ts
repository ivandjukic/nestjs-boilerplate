import * as crypto from 'crypto'

export const hashSecret = (secret: string, salt = '', numberOfIterations = 10000): string => {
    return crypto.pbkdf2Sync(secret, salt, numberOfIterations, 64, `sha512`).toString(`hex`)
}
