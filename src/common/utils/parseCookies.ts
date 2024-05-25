import { ParsedCookie } from '../types/ParsedCookie'

export const parseCookies = (setCookiesString: string[]): ParsedCookie[] => {
    return setCookiesString.map((cookieString) => {
        const parts = cookieString.split(';').map((part) => part.trim())
        const cookieParts = parts[0].split('=')
        const name = cookieParts[0]
        const value = cookieParts[1]
        // Construct an object to represent the cookie, similar to what cookie-parser does for request cookies
        const cookie = { name, value }
        parts.slice(1).forEach((part) => {
            const [key, val] = part.split('=')
            cookie[key.toLowerCase()] = val || true
        })
        return cookie
    }) as ParsedCookie[]
}
