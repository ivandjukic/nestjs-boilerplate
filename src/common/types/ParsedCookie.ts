export interface ParsedCookie {
    expires: string
    httponly: boolean
    'max-age': string
    name: string
    path: string
    secure: boolean
    value: string
}
