# Security & Compliance Guide

## Security Overview

Project ZAR implements multiple layers of security to protect sensitive cryptocurrency and customer data.

## Authentication & Authorization

### Current Status
- Internal tool (no public authentication)
- Environment-based access control

### Future Implementation

```typescript
// auth/useAuth.ts
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
    } else {
      validateToken(token).then(setIsAuthenticated);
    }
  }, []);

  return { isAuthenticated };
};
```

## API Security

### HTTPS Enforcement

All external API calls use HTTPS:
```typescript
const API_ENDPOINT = process.env.VITE_AWS_API_ENDPOINT;
// Must start with https://
```

### Environment Variables

Sensitive information stored in `.env`:
```env
# Never commit .env to repository
VITE_ETHERSCAN_API_KEY=xxxx
VITE_LUNO_API_KEY=xxxx
VITE_AWS_API_ENDPOINT=xxxx
```

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### Rate Limiting

AWS Lambda implements rate limiting:
```
- 100 requests/minute per API key
- 1000 requests/minute per IP
- Auto-blocking of suspicious patterns
```

## Data Protection

### PII Handling

Customer personally identifiable information:
- Stored securely in AWS
- Never logged to console
- Encrypted in transit
- Limited access via IAM roles

### Input Validation

All user inputs validated:
```typescript
// Wallet address validation
const isValidWalletAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Email validation
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ID number validation
const isValidSouthAfricanID = (id: string): boolean => {
  return /^\d{13}$/.test(id);
};
```

### XSS Protection

React's built-in protections:
```typescript
// Safe: React escapes by default
<div>{userInput}</div>

// Unsafe: Only if absolutely necessary
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### CSRF Protection

For state-changing requests:
```typescript
// Add CSRF token to POST requests
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

const response = await fetch(API_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

## Compliance Requirements

### POPIA (South African Data Protection)
- ✅ Legitimate purpose for processing
- ✅ Consent for data collection
- ✅ Data minimization
- ✅ Security measures implemented
- ✅ Data subject rights respected
- ✅ Data breach notification procedures

### FICA (Financial Intelligence Centre)
- ✅ KYC verification required
- ✅ Customer identification
- ✅ Risk assessment
- ✅ Transaction monitoring
- ✅ Suspicious transaction reporting
- ✅ Record keeping (5 years)

### AML/CFT (Anti-Money Laundering/Counter-Terrorist Financing)
- ✅ Risk scoring system
- ✅ Suspicious activity detection
- ✅ Alert generation
- ✅ Audit trail
- ✅ Sanctions screening
- ✅ Enhanced due diligence

## Security Checklist

### Development
- [ ] No hardcoded secrets in code
- [ ] API keys in .env only
- [ ] No console.log of sensitive data
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] CSRF tokens on state-changing requests
- [ ] Dependencies up to date
- [ ] No vulnerable packages

### Deployment
- [ ] SSL certificate valid and non-expired
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Security headers configured
- [ ] WAF rules enabled
- [ ] DDoS protection active
- [ ] VPC endpoints for AWS services
- [ ] Secrets stored in AWS Secrets Manager
- [ ] CloudTrail logging enabled

### Operations
- [ ] API keys rotated monthly
- [ ] Logs monitored for anomalies
- [ ] Backups tested regularly
- [ ] Incident response plan documented
- [ ] Security audits quarterly
- [ ] Penetration testing annual
- [ ] Team security training current
- [ ] Access control reviews

## Security Headers

Configure in CloudFront:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

CloudFront Lambda@Edge function:
```javascript
exports.handler = (event, context, callback) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }];

  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];

  callback(null, response);
};
```

## Encryption

### At Rest
- AWS S3 default encryption (AES-256)
- Database encryption enabled
- Backups encrypted

### In Transit
- TLS 1.2+ for all connections
- Perfect Forward Secrecy enabled
- Certificate pinning for APIs

## Incident Response

### Security Incident Procedure

1. **Detection** - Alert triggered
2. **Assessment** - Determine severity
3. **Containment** - Isolate affected systems
4. **Eradication** - Remove threat
5. **Recovery** - Restore systems
6. **Lessons Learned** - Post-mortem

### Severity Levels

| Level | Response Time | Example |
|-------|---------------|---------|
| Critical | 15 minutes | Data breach, ransomware |
| High | 1 hour | Unauthorized access |
| Medium | 4 hours | Failed authentication attempt |
| Low | 1 day | Policy violation |

### Contact Information

- Security Team: security@yourcompany.com
- Incident Hotline: +27-123-456-7890
- Report: https://security.yourcompany.com/report

## Vulnerability Management

### Reporting Security Issues

Found a vulnerability? Please report to: security@yourcompany.com

**Include**:
- Vulnerability description
- Impact assessment
- Steps to reproduce
- Suggested fix (if any)

**Do NOT**:
- Publicly disclose before patch
- Access other users' data
- Modify data
- Disrupt service

### Patch Management

- Critical: 24 hours
- High: 72 hours
- Medium: 1 week
- Low: 2 weeks

## Third-Party Security

### Vendor Assessment

When integrating third-party services:
- [ ] Security assessment completed
- [ ] SLA reviewed
- [ ] Data processing agreement signed
- [ ] SOC 2 compliance verified
- [ ] References checked

### Dependencies

```bash
# Check for vulnerabilities
npm audit

# Update packages safely
npm update

# Monitor for new vulnerabilities
npm audit --audit-level=moderate
```

## Access Control

### AWS IAM Roles

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::project-zar-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": ["lambda:InvokeFunction"],
      "Resource": "arn:aws:lambda:us-east-1:*:function:*"
    }
  ]
}
```

### Principle of Least Privilege

- Users get minimum required permissions
- Regular access reviews
- Unused credentials deactivated
- MFA required for sensitive operations

## Security Training

All team members should be trained on:
- OWASP Top 10
- Secure coding practices
- Social engineering awareness
- Password best practices
- Incident response procedures

---

**Last Updated**: December 2025
**Security Officer**: [Name]
**Review Frequency**: Quarterly