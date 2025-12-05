# Project ZAR

A cryptocurrency wallet intelligence and banking compliance platform for monitoring customer crypto exposure, risk assessment, and regulatory reporting.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Risk Assessment](#risk-assessment)
- [Browser Support](#browser-support)
- [Security](#security)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Overview

Project ZAR consists of two integrated applications designed for financial institutions to manage cryptocurrency compliance and customer risk assessment:

1. **Wallet Intelligence Platform** (`/`) - Search-based analyzer for detailed wallet analysis, identity verification, and compliance reporting
2. **Banking Compliance Dashboard** (`/dashboard`) - Real-time monitoring of customer cryptocurrency exposure and risk management

## ✨ Features

### Wallet Intelligence Platform

- 🔍 **Wallet & ID Search** - Lookup wallet addresses or SA ID numbers for instant analysis
- 📊 **Risk Scoring** - Automated 0-100 risk score calculation with detailed breakdown
- ✅ **KYC Verification** - Identity verification status and compliance checks
- 💼 **Portfolio Analysis** - Token breakdown and asset distribution visualization
- 📈 **Transaction Flow** - Visual representation of transaction patterns and flows
- ⚠️ **Risk Flags** - Detection of mixer usage, sanctions, and high-risk jurisdictions
- 📄 **Compliance Reports** - Generate and export PDF compliance reports

### Banking Compliance Dashboard

- 📈 **KPI Overview** - Total customers, high-risk count, and total crypto exposure metrics
- 📊 **Risk Distribution** - Visual analytics of customer risk segmentation
- 💹 **Live Market Data** - Real-time cryptocurrency prices in ZAR (ETH, XBT, SOL, XRP, LTC, BCH)
- 🚨 **Real-Time Alerts** - Instant notifications for high-risk transactions and undeclared wallets
- 👥 **Customer Management** - Detailed customer profiles with wallet tracking
- 📥 **Bulk Data Import** - XML-based customer data import functionality
- ⚙️ **Customizable Settings** - Notification preferences and alert thresholds

## 🛠 Tech Stack

### Frontend

- **React 18** - UI library with TypeScript for type safety
- **Vite** - Lightning-fast build tooling and dev server
- **Tailwind CSS** - Utility-first styling with custom design system
- **shadcn/ui** - High-quality, accessible component library
- **Recharts** - Composable React charting library
- **React Router v6** - Client-side routing and navigation

### Backend Infrastructure

- **AWS Lambda** - Serverless compute for scalable data processing
- **AWS API Gateway** - RESTful API endpoint management
- **AWS S3** - File storage for XML uploads and report exports

### External APIs

- **Luno API** - South African cryptocurrency exchange for live ZAR market data
- **Etherscan API** - Ethereum blockchain data, wallet analysis, and transaction history

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, and technology layers |
| [INSTALLATION.md](docs/INSTALLATION.md) | Setup, configuration, and troubleshooting installation issues |
| [API.md](docs/API.md) | Complete API endpoint reference with examples |
| [COMPONENTS.md](docs/COMPONENTS.md) | React component guide and best practices |
| [RISK_SCORING.md](docs/RISK_SCORING.md) | Risk calculation methodology and factors |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide (AWS S3, CloudFront, Lambda) |
| [SECURITY.md](docs/SECURITY.md) | Security best practices, compliance (POPIA, FICA, AML/CFT) |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [FAQ.md](docs/FAQ.md) | Frequently asked questions |

**Quick Links**:
- New to Project ZAR? Start with [INSTALLATION.md](docs/INSTALLATION.md)
- Deploying to production? See [DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Integrating with APIs? Check [API.md](docs/API.md)
- Having issues? Visit [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## 📁 Project Structure

```
project-zar/
├── src/
│   ├── components/
│   │   ├── analysis/           # Wallet analysis UI components
│   │   ├── dashboard/          # Dashboard KPI cards and widgets
│   │   ├── reports/            # Report generation components
│   │   └── ui/                 # shadcn/ui and custom UI components
│   ├── pages/
│   │   ├── Index.tsx           # Wallet search landing page
│   │   ├── Results.tsx         # Analysis results display
│   │   ├── Dashboard.tsx       # Main compliance dashboard
│   │   ├── Customers.tsx       # Customer list view
│   │   ├── CustomerDetail.tsx  # Individual customer profile
│   │   ├── DataImport.tsx      # XML bulk import
│   │   ├── Alerts.tsx          # Risk alerts management
│   │   ├── Market.tsx          # Cryptocurrency market data
│   │   ├── Reports.tsx         # Report generation and history
│   │   └── Settings.tsx        # User and system settings
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   └── styles/                 # Global and design system CSS
├── docs/                       # Comprehensive documentation
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── README.md                   # This file
```

## 🔗 API Endpoints

### AWS Lambda Services

| Endpoint | Method | Description | Docs |
|----------|--------|-------------|------|
| `/customers` | POST | Fetch customer data and risk profiles | [API.md](docs/API.md#1-get-customers) |
| `/upload-xml` | POST | Bulk customer data import from XML | [API.md](docs/API.md#2-upload-xml-data) |
| `/wallets` | POST | Retrieve wallet analysis | [API.md](docs/API.md#3-get-wallet-analysis) |

### Luno API Integration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/1/ticker` | GET | Live cryptocurrency prices (ZAR pairs) |
| `/api/1/tickers` | GET | All available market pairs |

### Etherscan API Integration

| Function | Purpose |
|----------|---------|
| Account balance queries | Get ETH holdings for wallet |
| Transaction history | Retrieve account transaction logs |
| Token holdings | ERC-20 token balance lookup |
| Contract interactions | Analyze smart contract interactions |

See [API.md](docs/API.md) for complete endpoint documentation with request/response examples.

## 📊 Risk Assessment

### Risk Score Color Coding

| Score Range | Risk Level | Color | Description |
|-------------|------------|-------|-------------|
| 0-30 | Low | 🟢 Green | Minimal compliance risk |
| 31-70 | Medium | 🟡 Amber | Moderate risk requiring monitoring |
| 71-100 | High | 🔴 Red | High risk, immediate attention required |

### Risk Factors

- Mixer/tumbler service usage
- Sanctioned entity involvement
- High-risk jurisdiction activity
- Undeclared wallet holdings
- Transaction pattern anomalies
- KYC status and verification

**Want to understand how risk is calculated?** See [RISK_SCORING.md](docs/RISK_SCORING.md) for the complete algorithm with weighted factors and examples.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: 2.40.0 or higher
- **AWS Account**: For backend services (optional for development)
- **API Keys**: Etherscan and Luno (required for full functionality)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/project-zar.git
cd project-zar

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Add your API keys to .env
# Edit .env and add:
# - VITE_ETHERSCAN_API_KEY
# - VITE_LUNO_API_KEY
# - VITE_AWS_API_ENDPOINT (if using backend)

# 5. Start development server
npm run dev

# 6. Open http://localhost:5173 in your browser
```

### Development Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run linter
npm run type-check # Check TypeScript types
```

**Detailed setup instructions?** See [INSTALLATION.md](docs/INSTALLATION.md)

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# API Keys
VITE_ETHERSCAN_API_KEY=your_etherscan_api_key_here
VITE_LUNO_API_KEY=your_luno_api_key_here

# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_API_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev

# Feature Flags
VITE_ENABLE_XML_IMPORT=true
VITE_ENABLE_ALERTS=true
VITE_ENABLE_REPORTS=true

# App Configuration
VITE_APP_NAME=Project ZAR
VITE_COMPANY_NAME=Your Company

# Risk Thresholds (optional)
VITE_RISK_THRESHOLD_HIGH=70
VITE_RISK_THRESHOLD_MEDIUM=30
```

**Getting API keys?** See [INSTALLATION.md](docs/INSTALLATION.md#getting-api-keys)

## 📱 Browser Support

| Browser | Minimum | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |
| Mobile Safari | 14+ | ✅ Supported |
| Chrome Mobile | 90+ | ✅ Supported |

## 🎨 Design System

The application uses a custom design system built on Tailwind CSS:

- **Primary (Green)**: Low-risk indicators and success states
- **Accent (Amber)**: Medium-risk warnings and caution states
- **Destructive (Red)**: High-risk alerts and critical states
- **Background**: Deep charcoal (improved accessibility and reduced eye strain)

Components are built with [shadcn/ui](https://ui.shadcn.com/) for consistency and accessibility.

## 📈 Performance

- **Optimized Build**: Vite provides fast development and production builds
- **Code Splitting**: Lazy loading for dashboard components
- **Caching**: Efficient API response caching
- **Real-time Updates**: Intelligent polling for market data and alerts

## 🔒 Security

Project ZAR implements comprehensive security measures:

- ✅ **HTTPS Enforcement** - All external API calls use HTTPS
- ✅ **Environment Variables** - Sensitive keys never in source code
- ✅ **Input Validation** - All user inputs validated
- ✅ **XSS Protection** - React's built-in protections enabled
- ✅ **Compliance** - POPIA, FICA, and AML/CFT compliant
- ✅ **Encryption** - Data encrypted at rest and in transit
- ✅ **Audit Logging** - Complete audit trail for compliance

**Security concerns?** See [SECURITY.md](docs/SECURITY.md)

## 📝 Contributing

We welcome contributions! Here's how to get started:

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git commit -am 'Add new feature'
```

3. Push to your branch:
```bash
git push origin feature/your-feature-name
```

4. Open a Pull Request with:
   - Clear description of changes
   - Reference to any related issues
   - Screenshots for UI changes

**Code style**: Follow existing patterns. TypeScript required for new code.

## 🆘 Support

Need help? Resources available:

| Issue Type | Resource |
|-----------|----------|
| Installation/Setup | [INSTALLATION.md](docs/INSTALLATION.md) |
| API Questions | [API.md](docs/API.md) |
| Problems/Errors | [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |
| General Questions | [FAQ.md](docs/FAQ.md) |
| Bug Report | [Issues](https://github.com/your-org/project-zar/issues) |
| Technical Support | support@yourcompany.com |
| Security Issues | security@yourcompany.com |

**Having issues?** Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) first - it covers 90% of common problems.

## 📄 License

Proprietary - All rights reserved

---

## Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Test production build

# Quality
npm run lint             # Check code style
npm run type-check       # Check TypeScript

# Deployment
npm run build            # Create production bundle
# See DEPLOYMENT.md for AWS deployment instructions
```

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Maintainer**: Project ZAR Team

For more information, visit the [documentation](docs/) folder or contact support@yourcompany.com