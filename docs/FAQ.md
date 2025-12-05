# Frequently Asked Questions (FAQ)

## General Questions

### Q: What is Project ZAR?

A: Project ZAR is a cryptocurrency wallet intelligence and banking compliance platform designed for financial institutions. It helps monitor customer crypto exposure, assess compliance risk, and generate regulatory reports for South Africa's banking sector.

---

### Q: Who should use Project ZAR?

A: Project ZAR is designed for:
- Commercial banks
- Financial institutions
- Compliance departments
- AML/CFT specialists
- Risk management teams

---

### Q: Is Project ZAR production-ready?

A: Yes, the platform is fully production-ready with:
- Secure AWS infrastructure
- Compliance features (POPIA, FICA, AML/CFT)
- Comprehensive audit trails
- High availability architecture

---

### Q: What's the cost?

A: Pricing depends on:
- Number of customers
- API call volume
- AWS infrastructure usage
- Support tier

Contact sales@yourcompany.com for quotes.

---

### Q: Does Project ZAR integrate with our existing systems?

A: Yes, Project ZAR provides:
- REST API endpoints
- XML/CSV import functionality
- Custom integration possibilities
- Third-party webhook support

Contact integration@yourcompany.com for details.

---

## Technical Questions

### Q: What cryptocurrencies are supported?

A: **Currently supported**:
- Ethereum (ETH)

**Coming soon**:
- Bitcoin (BTC) - Q1 2025
- Polygon (MATIC) - Q2 2025
- Litecoin (LTC) - Q3 2025

---

### Q: How often are market prices updated?

A: Market prices update every **60 seconds automatically** from Luno API. Users can also manually refresh using the Refresh button.

---

### Q: What blockchain networks are supported?

A: **Currently supported**:
- Ethereum mainnet

**Coming soon**:
- Layer 2 solutions (Polygon, Arbitrum)
- Bitcoin network
- Multi-chain support

---

### Q: Can I export customer data?

A: Yes, you can export data in multiple formats:
- **JSON**: Complete dashboard snapshot
- **CSV**: Customer list
- **PDF**: Compliance reports
- **XML**: Bulk data

Use the Export button on dashboard or Reports page.

---

### Q: What's the maximum number of customers supported?

A: Project ZAR has been tested with up to **10,000 customers** with no performance degradation. Larger deployments available with enterprise scaling.

---

### Q: Does the platform support API integrations?

A: Yes, REST API available for:
- Customer management
- Wallet analysis
- Risk scoring
- Report generation

See [API.md](API.md) for full documentation.

---

## Risk Scoring Questions

### Q: How is the risk score calculated?

A: Risk scores use a weighted formula combining:
- **Transaction patterns** (25%)
- **Wallet history** (20%)
- **Compliance flags** (35%)
- **Mixer/tumbler usage** (20%)

See [RISK_SCORING.md](RISK_SCORING.md) for detailed methodology.

---

### Q: Can I customize risk thresholds?

A: Yes, risk thresholds are fully configurable via environment variables:

```env
VITE_RISK_THRESHOLD_HIGH=70      # Default 70
VITE_RISK_THRESHOLD_MEDIUM=30    # Default 30
```

Also customize factor weights:
```env
VITE_RISK_WEIGHT_PATTERN=25
VITE_RISK_WEIGHT_HISTORY=20
VITE_RISK_WEIGHT_COMPLIANCE=35
VITE_RISK_WEIGHT_MIXER=20
```

---

### Q: What factors affect the risk score?

A: Main factors:
1. **Transaction patterns** - Frequency, size, timing
2. **Wallet history** - Age, activity level, inactivity
3. **Compliance flags** - Undeclared wallets, sanctions, KYC status
4. **Mixer usage** - Direct or indirect use of mixing services

---

### Q: How often are risk scores updated?

A: Risk scores recalculate automatically when:
- New transactions occur
- Wallet marked as declared/undeclared
- Customer KYC status changes
- Sanctioned list updates

Manual refresh available anytime.

---

### Q: Why did a customer's risk score change suddenly?

A: Score changes due to:
- New transactions detected
- Mixer service usage identified
- KYC status update
- Connection to sanctioned entity
- New compliance flag triggered

Check the Alerts section for details.

---

## Data Management Questions

### Q: How do I import customer data?

A: Three methods:

**Method 1: XML Import**
1. Go to Data Import
2. Upload XML file
3. System validates and imports

**Method 2: Manual Entry**
1. Go to Customers
2. Click "Add Customer"
3. Fill details and wallets

**Method 3: API**
See [API.md](API.md) for bulk import endpoint.

---

### Q: What's the XML import format?

A: Example structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<customers>
  <customer>
    <id>CUST001</id>
    <first_name>John</first_name>
    <last_name>Doe</last_name>
    <email>john@example.com</email>
    <id_number>9005151234567</id_number>
    <wallets>
      <wallet>
        <address>0x742d35Cc6634C0532925a3b844Bc9e7595f84bAF</address>
        <declared>true</declared>
      </wallet>
    </wallets>
  </customer>
</customers>
```

---

### Q: How is customer data stored?

A: Customer data stored in:
- **AWS S3** - Primary storage (encrypted)
- **AWS DynamoDB** - Customer profiles (encrypted)
- **AWS RDS** - Transactional data (encrypted)
- **CloudWatch** - Audit logs (30-day retention)

All encrypted at rest and in transit.

---

### Q: Can I delete customer data?

A: Yes, deletion options:

**Individual customer**:
1. Go to Customers
2. Select customer
3. Click Delete
4. Confirm

**Bulk deletion**:
Contact admin@yourcompany.com

**Compliance**: Data retention policies available upon request.

---

### Q: What about data privacy and compliance?

A: We comply with:
- **POPIA** - South African Data Protection Act
- **FICA** - Financial Intelligence Centre Act
- **AML/CFT** - Anti-Money Laundering/Counter-Terrorist Financing
- **GDPR** - General Data Protection Regulation (if EU users)

See [SECURITY.md](SECURITY.md) for details.

---

### Q: How long is data retained?

A: Default retention:
- **Customer data**: 7 years (compliance requirement)
- **Transaction logs**: 5 years (FICA requirement)
- **Audit logs**: 2 years (internal policy)
- **Deleted data**: 30-day recovery window

Customizable per institution.

---

## Wallet & Transaction Questions

### Q: How do I add wallets to a customer?

A: Two methods:

**Method 1: Manual**
1. Go to Customers
2. Select customer
3. Click "Add Wallet"
4. Enter wallet address
5. Mark as declared/undeclared

**Method 2: During import**
Include wallets in XML/CSV file.

---

### Q: What's the difference between declared and undeclared wallets?

A: **Declared wallets**:
- Customer acknowledged
- Included in their profile
- Lower risk score contribution

**Undeclared wallets**:
- Not on customer profile
- Discovered through analysis
- Higher risk score contribution
- Triggers compliance alert

---

### Q: Can I track multiple blockchains for one wallet?

A: Currently only Ethereum supported. Bitcoin and other chains coming soon. For now, create separate wallet records for different addresses.

---

### Q: How does the system find undeclared wallets?

A: System identifies undeclared wallets by:
- Analyzing transaction patterns
- Cross-referencing known customer addresses
- Detecting connected wallet clusters
- Machine learning analysis

Undeclared wallets trigger compliance alerts.

---

### Q: What's a wallet risk score?

A: Individual wallet risk (0-100) based on:
- Transaction history
- Connected addresses
- Mixer usage
- Sanctioned entity connections

Customer risk = weighted average of wallet risks.

---

## Compliance & Regulatory Questions

### Q: Is Project ZAR compliant with POPIA?

A: Yes, full POPIA compliance including:
- Legitimate purpose for processing
- Customer consent mechanisms
- Data minimization practices
- Security measures
- Data subject rights (access, correction, deletion)

See [SECURITY.md](SECURITY.md) for details.

---

### Q: Does it support FICA requirements?

A: Yes, FICA-compliant features:
- KYC verification workflow
- Customer identification
- Risk-based assessment
- Transaction monitoring
- Suspicious activity reporting
- 5-year record keeping

---

### Q: What about AML/CFT reporting?

A: Full AML/CFT support:
- Comprehensive risk scoring
- Suspicious activity detection
- Automated alert system
- Regulatory reporting templates
- Audit trail for compliance
- FATF recommendations alignment

---

### Q: Can I generate compliance reports?

A: Yes, multiple report types:
- **Customer risk report** - Comprehensive risk assessment
- **Transactions report** - Transaction history and analysis
- **Sanctions report** - Sanctions screening results
- **Compliance report** - Regulatory compliance checklist
- **Audit report** - System audit trail

Go to Reports page to generate.

---

### Q: What regulations does Project ZAR support?

A: Project ZAR supports:
- **South Africa**: POPIA, FICA, AML/CFT
- **International**: FATF recommendations, GDPR
- **Industry**: Banking standards, ISO 27001

---

## Troubleshooting Questions

### Q: The app won't load. What should I do?

A: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - "Quick Diagnostics" section for step-by-step troubleshooting.

---

### Q: How do I fix "API connection error"?

A: **Steps**:
1. Check `.env` file has correct `VITE_AWS_API_ENDPOINT`
2. Test endpoint with curl
3. Verify AWS Lambda functions are deployed
4. Restart the app

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

---

### Q: Market prices are stuck. How do I fix it?

A: **Steps**:
1. Check Luno API status
2. Verify Luno API key
3. Wait 60 seconds and refresh
4. Check browser console for errors

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more solutions.

---

### Q: Dashboard is slow. How do I optimize?

A: **Solutions**:
1. Reduce customer dataset for testing
2. Clear browser cache (Ctrl+Shift+Delete)
3. Disable browser extensions
4. Try different browser
5. Check network tab (F12) for slow requests

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for performance debugging.

---

## Feature Questions

### Q: Can I create custom dashboards?

A: Currently, one standard dashboard. Custom dashboards available in:
- **Pro tier**: Coming Q1 2025
- **Enterprise**: Custom development available

Contact sales@yourcompany.com.

---

### Q: Can I set up automated alerts?

A: Yes, alert configuration in Settings:
- Risk threshold alerts
- Transaction alerts
- Compliance alerts
- Email notifications

Email and push notifications supported.

---

### Q: Can I schedule reports?

A: Manual report generation available. Scheduled reports coming in v1.1.

Workaround: Use CI/CD pipeline to schedule reports.

---

### Q: Is there a mobile app?

A: Mobile-responsive web app available. Native mobile apps coming Q3 2025.

---

## Account & Access Questions

### Q: How do I change my password?

A: Go to **Settings → Security → Change Password**
1. Enter current password
2. Enter new password
3. Confirm new password
4. Click Save

---

### Q: How do I reset my account?

A: Contact your system administrator at admin@yourcompany.com

---

### Q: Can I have multiple user accounts?

A: Currently single-user per installation. Multi-user support coming in v1.1 with role-based access control.

---

### Q: How do I get admin access?

A: Contact your system administrator. Admin privileges required for:
- User management
- System configuration
- Data import/export
- Compliance settings

---

### Q: Can I invite team members?

A: User management coming in v1.1. Currently contact admin@yourcompany.com for access requests.

---

## Support Questions

### Q: How do I report a bug?

A: **Report to**: support@yourcompany.com

**Include**:
- Bug description
- Steps to reproduce
- Browser/OS information
- Error message/screenshot
- Expected vs actual behavior

---

### Q: Where can I find documentation?

A: Documentation available at:
- `/docs` folder in project
- https://docs.yourcompany.com
- [README.md](../README.md)

---

### Q: How do I get technical support?

A: Support channels:
- **Email**: support@yourcompany.com
- **Phone**: +27-123-456-7890
- **Chat**: Coming Q1 2025

Support hours: Monday-Friday, 08:00-17:00 SAST

---

### Q: Is there a changelog?

A: Check [CHANGELOG.md](../CHANGELOG.md) in project root for version history.

---

### Q: When is the next release?

A: Release schedule:
- **v1.1** - Q1 2025 (Multi-user support)
- **v1.2** - Q2 2025 (Bitcoin support)
- **v1.3** - Q3 2025 (Mobile app)

Subscribe to updates at https://yourcompany.com/updates

---

## Performance Questions

### Q: How many requests per minute can the system handle?

A: Capacity:
- **API**: 1,000 requests/minute
- **Dashboard**: 100 concurrent users
- **Import**: 10,000 customers/batch

Enterprise scaling available.

---

### Q: What's the maximum file size for XML import?

A: File size limits:
- **Single file**: 100MB
- **Single batch**: 1GB

Larger files: Split and import in multiple batches.

---

### Q: How fast is risk scoring?

A: Performance:
- **Single wallet**: ~50ms
- **Customer (5 wallets)**: ~300ms
- **Batch (100 customers)**: ~20 seconds

---

### Q: What's the latency on API calls?

A: Typical latency:
- **AWS region**: <100ms
- **International**: 100-500ms
- **Peak hours**: <500ms

---

## Security Questions

### Q: Is my data encrypted?

A: Yes, encryption at:
- **Rest**: AES-256 (AWS S3)
- **Transit**: TLS 1.2+ (HTTPS)
- **Database**: AWS encryption keys

---

### Q: How often are backups taken?

A: Backup schedule:
- **Automated**: Daily
- **Retention**: 30 days
- **Tested**: Weekly
- **Disaster recovery**: 4-hour RTO

---

### Q: What happens in a security breach?

A: Incident response:
1. Detection and alerting
2. Immediate containment
3. Root cause analysis
4. Customer notification
5. Remediation and hardening

See [SECURITY.md](SECURITY.md) for details.

---

### Q: Are API calls logged?

A: Yes, all API calls logged for:
- Audit trail
- Compliance
- Debugging
- Performance monitoring

Logs retained 30 days, then archived.

---

## Contact Information

**Support**: support@yourcompany.com  
**Sales**: sales@yourcompany.com  
**Security**: security@yourcompany.com  
**Technical**: tech@yourcompany.com  
**Phone**: +27-123-456-7890  
**Website**: https://yourcompany.com  
**Documentation**: https://docs.yourcompany.com

---

**Last Updated**: December 2025  
**Version**: FAQ v1.0