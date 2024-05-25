import { getOffset, getPagination, getPreviousPage } from '../pagination'

describe('pagination', () => {
    describe('getPreviousPage', () => {
        it('should return previous page number', () => {
            expect(getPreviousPage(1, 20, 100)).toBe(null)
            expect(getPreviousPage(2, 20, 100)).toBe(1)
            expect(getPreviousPage(3, 20, 100)).toBe(2)
            expect(getPreviousPage(4, 20, 100)).toBe(3)
            expect(getPreviousPage(5, 20, 100)).toBe(4)
            expect(getPreviousPage(6, 20, 100)).toBe(5)
        })
    })

    describe('getOffset', () => {
        it('should return offset', () => {
            expect(getOffset(1, 20)).toBe(0)
            expect(getOffset(2, 20)).toBe(20)
            expect(getOffset(3, 20)).toBe(40)
            expect(getOffset(4, 20)).toBe(60)
            expect(getOffset(5, 20)).toBe(80)
            expect(getOffset(6, 20)).toBe(100)
        })
    })

    describe('getPagination', () => {
        it('should return pagination', () => {
            expect(getPagination(1, 20, 100)).toStrictEqual({
                per_page: 20,
                total_pages: 5,
                total_items: 100,
                current_page: 1,
                previous_page: null,
                next_page: 2,
            })
            expect(getPagination(1, 20, 0)).toStrictEqual({
                per_page: 20,
                total_pages: 1,
                total_items: 0,
                current_page: 1,
                previous_page: null,
                next_page: null,
            })

            expect(getPagination(2, 20, 100)).toStrictEqual({
                per_page: 20,
                total_pages: 5,
                total_items: 100,
                current_page: 2,
                previous_page: 1,
                next_page: 3,
            })
        })
    })
})
