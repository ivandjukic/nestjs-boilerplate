import { hashSecret } from '../hashSecret'

describe('hashSecret', () => {
    it('should return a hash', () => {
        const secret = 'testSecret'
        const hash = hashSecret(secret)
        expect(hash).toBeDefined()
    })

    it('should return a different hash for different salts with the same secret', () => {
        const secret = 'testSecret'
        const salt1 = 'salt1'
        const salt2 = 'salt2'
        const hash1 = hashSecret(secret, salt1)
        const hash2 = hashSecret(secret, salt2)

        expect(hash1).not.toEqual(hash2)
    })
})
