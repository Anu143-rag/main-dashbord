## 2024-05-24 - [Remove Hardcoded Login Credentials]
**Vulnerability:** Hardcoded credentials (email and password) were found in the initial state of the Login component (`src/pages/Login.tsx`).
**Learning:** Hardcoding credentials in the frontend exposes sensitive information to users, which can be seen in source control and by anyone who inspects the compiled application bundle.
**Prevention:** Always initialize authentication forms with empty strings and never store default or test credentials directly in the source code.

## 2024-05-24 - [Fix URL Injection in Avatar Generation]
**Vulnerability:** A potential URL injection vulnerability existed in `src/components/Header.tsx` where user-provided input (`displayName`) was concatenated directly into a query parameter without proper encoding (only spaces were replaced).
**Learning:** Failing to properly encode user input before interpolating it into a URL can allow an attacker to inject arbitrary query parameters (e.g., using `&` or `=`) and manipulate the behavior of the external API or application.
**Prevention:** Always use `encodeURIComponent()` (or equivalent encoding functions depending on the context) when including dynamic user input in URLs to ensure special characters are safely escaped.
