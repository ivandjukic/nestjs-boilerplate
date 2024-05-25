import { isConfigParameterEnabled } from '../isConfigParameterEnabled'

describe('isConfigParameterEnabled', () => {
    it('should return true when isEnabled is "true"', () => {
        expect(isConfigParameterEnabled('true')).toBe(true)
    })

    it('should return false when isEnabled is "false"', () => {
        expect(isConfigParameterEnabled('false')).toBe(false)
    })

    it('should return false when isEnabled is any string other than "true"', () => {
        expect(isConfigParameterEnabled('yes')).toBe(false)
        expect(isConfigParameterEnabled('1')).toBe(false)
        expect(isConfigParameterEnabled('0')).toBe(false)
        expect(isConfigParameterEnabled('')).toBe(false)
        expect(isConfigParameterEnabled('TRUE')).toBe(false)
    })
})
