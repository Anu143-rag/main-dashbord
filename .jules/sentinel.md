# Sentinel Journal

## Insecure Storage of JWT Token
- **Date**: August 2026
- **Vulnerability**: JWT token was being stored in `localStorage`, exposing it to Cross-Site Scripting (XSS) attacks. If an attacker managed to run arbitrary JavaScript on the application, they could easily read `localStorage.getItem('token')` and steal the authentication token, leading to complete account takeover.
- **Fix**: The architecture was changed to utilize HttpOnly cookies. A proxy server handles authentication requests (`/api/auth/login`) and sets a strict `HttpOnly` and `Secure` cookie containing the token. For subsequent requests, the proxy intercepts the request, reads the cookie, and forwards the `Authorization: Bearer <token>` header to the upstream API. The frontend now only stores non-sensitive user metadata in `localStorage` and relies on the browser to automatically include the `HttpOnly` cookie in API requests.
- **Learnings**: Avoid storing sensitive tokens in `localStorage` or `sessionStorage`. Always use `HttpOnly` cookies combined with CSRF protections (`SameSite=strict`) and `Secure` flags in production for managing authentication sessions.
