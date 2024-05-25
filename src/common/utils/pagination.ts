import { PaginationDto } from '../dtos/pagination.dto'

export const getPreviousPage = (page: number, itemsPerPage: number, numberOfResults: number): number | null => {
    if (page - 1 > Math.ceil(numberOfResults / itemsPerPage)) {
        return Math.ceil(numberOfResults / itemsPerPage)
    } else if (page - 1 < 1) {
        return null
    } else {
        return page - 1
    }
}

export const getOffset = (page: number, itemsPerPage: number): number => (page > 0 ? itemsPerPage * (page - 1) : 0)

export const getPagination = (page: number, perPage: number, numberOfResults: number): PaginationDto => {
    return {
        per_page: perPage,
        total_pages: Math.ceil(numberOfResults / perPage) > 0 ? Math.ceil(numberOfResults / perPage) : 1,
        total_items: numberOfResults,
        current_page: page,
        previous_page: getPreviousPage(page, perPage, numberOfResults),
        next_page: page + 1 > Math.ceil(numberOfResults / perPage) ? null : page + 1,
    }
}
