export interface SuccessfullySignedInData {
    jwtToken: string
    refreshToken: string
    rememberMe: boolean
    jwtTokenExpiresIn: number
    refreshTokenExpiresIn: number
}
