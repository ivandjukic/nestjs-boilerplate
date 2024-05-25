import { timeStringToMilliseconds } from '../timeStringToMilliseconds'

describe('timeStringToSeconds', () => {
    // Valid inputs
    it('should converts minutes to milliseconds correctly', () => {
        expect(timeStringToMilliseconds('5m')).toBe(300000)
        expect(timeStringToMilliseconds('10m')).toBe(600000)
        expect(timeStringToMilliseconds('15m')).toBe(900000)
        expect(timeStringToMilliseconds('100m')).toBe(6000000)
    })

    it('should converts hours to milliseconds correctly', () => {
        expect(timeStringToMilliseconds('2h')).toBe(7200000)
        expect(timeStringToMilliseconds('4h')).toBe(14400000)
        expect(timeStringToMilliseconds('6h')).toBe(21600000)
        expect(timeStringToMilliseconds('300h')).toBe(1080000000)
    })

    it('should converts days to milliseconds correctly', () => {
        expect(timeStringToMilliseconds('1d')).toBe(86400000)
        expect(timeStringToMilliseconds('2d')).toBe(172800000)
        expect(timeStringToMilliseconds('31d')).toBe(2678400000)
    })

    // Edge cases
    it('should converts 0 units correctly', () => {
        expect(timeStringToMilliseconds('0m')).toBe(0)
        expect(timeStringToMilliseconds('0h')).toBe(0)
        expect(timeStringToMilliseconds('0d')).toBe(0)
    })

    it('should handles large numbers correctly', () => {
        expect(timeStringToMilliseconds('5000h')).toBe(18000000000)
        expect(timeStringToMilliseconds('10000d')).toBe(864000000000)
        expect(timeStringToMilliseconds('100000m')).toBe(6000000000)
    })

    // Invalid inputs
    it('should returns 0 for non-numeric values', () => {
        expect(timeStringToMilliseconds('ah')).toBe(0)
    })

    it('should returns 0 for missing unit', () => {
        expect(timeStringToMilliseconds('100')).toBe(0)
    })

    it('should returns 0 for empty string', () => {
        expect(timeStringToMilliseconds('')).toBe(0)
    })

    it('should returns 0 for only unit without number', () => {
        expect(timeStringToMilliseconds('h')).toBe(0)
    })
})
