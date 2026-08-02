# Sentinel: Security Vulnerability Log

## [Insecure TLS Configuration] - [2024-05-18]

### Vulnerability Summary
- **Type:** Insecure TLS Configuration (Improper Certificate Validation)
- **Location:** `server.ts` (API and WebSocket proxy configurations)
- **Description:** The Express server used `http-proxy-middleware` configured with `secure: false`. This disabled SSL certificate validation when proxying requests to the backend (`https://gps-backend-jzd7.onrender.com`), making the application vulnerable to Man-in-the-Middle (MitM) attacks.

### Exploitation Scenario
- An attacker positioned on the network between the Express server and the backend server could intercept or modify traffic (such as sensitive data like device locations or admin credentials) by presenting a spoofed or self-signed certificate, which the server would blindly accept due to `secure: false`.

### Remediation
- **Fix:** Changed `secure: false` to `secure: true` in both the `apiProxy` and `wsProxy` configurations in `server.ts`.
- **Validation:** Enforcing `secure: true` requires the proxy to validate the backend's SSL certificate against trusted Certificate Authorities.
