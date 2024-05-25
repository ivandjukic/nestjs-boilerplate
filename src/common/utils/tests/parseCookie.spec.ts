import { parseCookies } from '../parseCookies'

describe('parseCookies', () => {
    it('should parse cookies', () => {
        const cookies = [
            'jwt_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFlYWU4MGEzLWE3NDAtNDM0Zi1hNDJiLTg0M2Y4NmJlNmJkMSIsInJlbWVtYmVyTWUiOmZhbHNlLCJpYXQiOjE3MDkzODQxODUsImV4cCI6MTcwOTM4NTk4NX0.rP-4l5Fi3HWc1SwSSIhqBwBmsNQi90vgUONqGowHXe8; Max-Age=1; Path=/; Expires=Sat, 02 Mar 2024 12:56:26 GMT; HttpOnly; Secure',
            'refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFlYWU4MGEzLWE3NDAtNDM0Zi1hNDJiLTg0M2Y4NmJlNmJkMSIsInJlZnJlc2giOnRydWUsInJlbWVtYmVyTWUiOmZhbHNlLCJpYXQiOjE3MDkzODQxODUsImV4cCI6MTcwOTQ3MDU4NX0.DTziO7zJR3-TVGyuOOBJrqAFp8oZOlHTbOYjW_VagJc; Max-Age=86; Path=/; Expires=Sat, 02 Mar 2024 12:57:51 GMT; HttpOnly; Secure',
            'remember_me=false; Max-Age=86; Path=/; Expires=Sat, 02 Mar 2024 12:57:51 GMT; HttpOnly; Secure',
        ]
        expect(parseCookies(cookies)).toEqual([
            {
                expires: 'Sat, 02 Mar 2024 12:56:26 GMT',
                httponly: true,
                'max-age': '1',
                name: 'jwt_token',
                path: '/',
                secure: true,
                value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFlYWU4MGEzLWE3NDAtNDM0Zi1hNDJiLTg0M2Y4NmJlNmJkMSIsInJlbWVtYmVyTWUiOmZhbHNlLCJpYXQiOjE3MDkzODQxODUsImV4cCI6MTcwOTM4NTk4NX0.rP-4l5Fi3HWc1SwSSIhqBwBmsNQi90vgUONqGowHXe8',
            },
            {
                expires: 'Sat, 02 Mar 2024 12:57:51 GMT',
                httponly: true,
                'max-age': '86',
                name: 'refresh_token',
                path: '/',
                secure: true,
                value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFlYWU4MGEzLWE3NDAtNDM0Zi1hNDJiLTg0M2Y4NmJlNmJkMSIsInJlZnJlc2giOnRydWUsInJlbWVtYmVyTWUiOmZhbHNlLCJpYXQiOjE3MDkzODQxODUsImV4cCI6MTcwOTQ3MDU4NX0.DTziO7zJR3-TVGyuOOBJrqAFp8oZOlHTbOYjW_VagJc',
            },
            {
                expires: 'Sat, 02 Mar 2024 12:57:51 GMT',
                httponly: true,
                'max-age': '86',
                name: 'remember_me',
                path: '/',
                secure: true,
                value: 'false',
            },
        ])
    })
})
