# Project ZAR

A cryptocurrency wallet intelligence and banking compliance platform for monitoring customer crypto exposure, risk assessment, and regulatory reporting.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Risk Assessment](#risk-assessment)
- [Contributing](#contributing)
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

## 📁 Project Structure

```
src/
├── components/
│   ├── analysis/           # Wallet analysis UI components
│   ├── dashboard/          # Dashboard KPI cards and widgets
│   ├── reports/            # Report generation components
│   └── ui/                 # shadcn/ui and custom UI components
├── pages/
│   ├── Index.tsx           # Wallet search landing page
│   ├── Results.tsx         # Analysis results display
│   ├── Dashboard.tsx       # Main compliance dashboard
│   ├── Customers.tsx       # Customer list view
│   ├── CustomerDetail.tsx  # Individual customer profile
│   ├── DataImport.tsx      # XML bulk import
│   ├── Alerts.tsx          # Risk alerts management
│   ├── Market.tsx          # Cryptocurrency market data
│   ├── Reports.tsx         # Report generation and history
│   └── Settings.tsx        # User and system settings
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
└── styles/                 # Global and design system CSS
```

## 🔗 API Endpoints

### AWS Lambda Services

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/customers` | POST | Fetch customer data and risk profiles |
| `/upload-xml` | POST | Bulk customer data import from XML |
| `/wallets` | GET | Retrieve wallet information |

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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS account credentials (for backend)
- API keys for Etherscan and Luno

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/project-zar.git
cd project-zar

# Install dependencies
npm install

# Create .env file with required variables (see below)
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Development Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linter
npm run type-check # Check TypeScript
```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Keys
VITE_ETHERSCAN_API_KEY=your_etherscan_api_key
VITE_LUNO_API_KEY=your_luno_api_key

# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_API_ENDPOINT=your_api_gateway_url

# Feature Flags
VITE_ENABLE_XML_IMPORT=true
VITE_ENABLE_ALERTS=true
VITE_ENABLE_REPORTS=true

# App Configuration
VITE_APP_NAME=Project ZAR
VITE_COMPANY_NAME=Your Company
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Design System

The application uses a custom design system built on Tailwind CSS with the following color palette:

- **Primary (Green)**: Risk indicator for low-risk assets
- **Accent (Amber)**: Warning states and medium-risk alerts
- **Destructive (Red)**: High-risk and critical alerts
- **Background**: Deep charcoal (improved accessibility)

## 📈 Performance

- Optimized Vite build with code splitting
- Lazy loading for dashboard components
- API response caching with React Query
- Real-time updates with efficient polling

## 🔒 Security Considerations

- API keys stored in environment variables
- No sensitive data logged to console
- HTTPS enforcement for all API calls
- XSS and CSRF protections via React
- Input validation on all forms
- Rate limiting on AWS Lambda

## 📝 Contributing

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Commit changes (`git commit -am 'Add new feature'`)
3. Push to branch (`git push origin feature/your-feature`)
4. Open a Pull Request

## 📄 License

Proprietary - All rights reserved

---

**Last Updated**: December 2025  
**Version**: 1.0.0