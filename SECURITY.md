# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2.0 | :x:                |

## API Keys and Secrets

OrchTS connects to various LLM providers (currently OpenAI). Please note:

- Never commit API keys or secrets to the repository
- Use environment variables for sensitive data
- Be cautious when logging messages that might contain sensitive information
- Consider using secret scanning in your repositories

## Best Practices When Using OrchTS

1. **API Key Management**
   - Store API keys securely
   - Use environment variables
   - Consider using a secret management service
   - Rotate keys regularly

2. **Content Security**
   - Be mindful of the data you send to LLM providers
   - Don't send sensitive or personal information in prompts
   - Consider implementing content filtering
   - Be aware of data privacy regulations in your jurisdiction

3. **Rate Limiting**
   - Implement appropriate rate limiting
   - Monitor API usage
   - Handle API errors gracefully

## Reporting a Vulnerability

If you discover a security vulnerability within OrchTS, please send an email to info@netf.de. All security vulnerabilities will be promptly addressed.

Please include the following information:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggestions for mitigation (if any)

## Response Timeline

- Initial Response: Within 48 hours
- Vulnerability Assessment: Within 1 week
- Security Patch: As soon as possible, depending on severity

## Third-Party Dependencies

OrchTS relies on several third-party dependencies. We:
- Regularly update dependencies
- Monitor security advisories
- Use npm audit to check for known vulnerabilities
- Maintain a policy of keeping dependencies up to date

## Development Security

When contributing to OrchTS:
1. Keep your development environment secure
2. Use the latest stable versions of Node.js and npm
3. Run security audits regularly: `npm audit`
4. Follow secure coding practices
5. Review code for potential security issues

## Known Security Requirements and Limitations

- Node.js version >= 18.0.0 required
- TypeScript version >= 4.8.0 required
- Currently supports OpenAI's API security standards

## Security-Related Configuration

When configuring OrchTS:
```typescript
const client = new OrchTS({
  debug: false  // Set to false in production to avoid logging sensitive data
});
```

## Version Verification

You can verify the integrity of the package by checking:
```bash
npm audit
npm list @rdu/orchts
```

## Contact

For security-related inquiries, contact:
- Email: info@netf.de
- Subject Line: [SECURITY] OrchTS Security Issue
