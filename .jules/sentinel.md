# Sentinel Journal

## Vulnerability: Insecure TLS Configuration in Proxy Middleware

*   **Date Discovered:** $(date +%Y-%m-%d)
*   **Location:** `server.ts`
*   **Description:** The `http-proxy-middleware` was configured with `secure: false`, which disables TLS certificate verification. This could potentially allow Man-In-The-Middle (MITM) attacks when proxying API or WebSocket requests.
*   **Fix:** Removed the `secure: false` configuration from both `apiProxy` and `wsProxy` settings to enforce strict TLS verification.
*   **Impact if Unfixed:** High. An attacker could intercept and potentially modify sensitive data flowing between the frontend and the backend services.
*   **Lessons Learned:** Always enforce TLS verification (`secure: true` or default) when communicating with external or backend APIs, particularly when handling sensitive data or relying on secure protocols.
