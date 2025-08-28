# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Inti seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [security@inti.com](mailto:security@inti.com).

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

* **Type of issue** (buffer overflow, SQL injection, cross-site scripting, etc.)
* **Full paths of source file(s) related to the vulnerability**
* **The location of the affected source code (tag/branch/commit or direct URL)**
* **Any special configuration required to reproduce the issue**
* **Step-by-step instructions to reproduce the issue**
* **Proof-of-concept or exploit code (if possible)**
* **Impact of the issue, including how an attacker might exploit it**

This information will help us triage your report more quickly.

## Preferred Languages

We prefer all communications to be in English.

## Disclosure Policy

When we receive a security bug report, we will assign it to a primary handler. This person will coordinate the fix and release process, involving the following steps:

1. Confirm the problem and determine the affected versions.
2. Audit code to find any similar problems.
3. Prepare fixes for all supported versions. These fixes will be released as fast as possible to the main branch.

## Comments on this Policy

If you have suggestions on how this process could be improved please submit a pull request.

## Security Best Practices

### For Users

1. **Keep your dependencies updated**
   ```bash
   npm audit
   npm update
   ```

2. **Use environment variables for sensitive data**
   - Never commit API keys or secrets to version control
   - Use `.env.local` for local development
   - Use secure environment variable management in production

3. **Validate all user inputs**
   - Always validate and sanitize user inputs
   - Use TypeScript for type safety
   - Implement proper error handling

4. **Use HTTPS in production**
   - Always use HTTPS for production deployments
   - Configure proper SSL/TLS certificates
   - Enable security headers

### For Developers

1. **Follow secure coding practices**
   - Use parameterized queries to prevent SQL injection
   - Implement proper authentication and authorization
   - Use HTTPS for all external API calls
   - Validate and sanitize all inputs

2. **Regular security audits**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Keep dependencies updated**
   - Regularly update dependencies
   - Monitor for security advisories
   - Use automated dependency scanning

4. **Code review process**
   - All code changes should be reviewed
   - Pay special attention to security-related changes
   - Use automated security scanning tools

## Security Features

Inti includes several security features:

- **Input validation** for all user inputs
- **TypeScript** for type safety
- **Environment variable protection** for sensitive data
- **HTTPS enforcement** in production
- **Secure headers** configuration
- **Rate limiting** for API endpoints
- **CORS protection** for cross-origin requests

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked as security releases in the changelog.

## Acknowledgments

We would like to thank all security researchers who responsibly disclose vulnerabilities to us. Your contributions help make Inti more secure for everyone.
