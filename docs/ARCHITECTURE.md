# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                │
│  ┌──────────────────┬──────────────────┬──────────────┐ │
│  │ Wallet Search    │ Compliance       │ Market Data  │ │
│  │ Platform         │ Dashboard        │ Viewer       │ │
│  └──────────────────┴──────────────────┴──────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────────┐     ┌─────────▼──────────┐
│  AWS API Gateway   │     │  Luno API Gateway  │
└────────┬───────────┘     └─────────┬──────────┘
         │                           │
    ┌────▼────┐              ┌──────▼──────┐
    │ Lambda   │              │ Luno Market │
    │ Functions│              │ Data API    │
    └────┬─────┘              └─────────────┘
         │
    ┌────▼─────────────────┐
    │  Data Processing     │
    │  - Risk Scoring      │
    │  - KYC Verification  │
    │  - Report Generation │
    └──────┬───────────────┘
           │
    ┌──────▼────────┐
    │  AWS S3       │
    │  Data Storage │
    └───────────────┘
```

## Data Flow

1. **User Input** → Frontend captures wallet address or ID
2. **API Request** → Sent to AWS API Gateway
3. **Lambda Processing** → Data enrichment and risk calculation
4. **External APIs** → Queries Etherscan and Luno for current data
5. **Response** → Risk scores and analysis returned to frontend
6. **Visualization** → Results displayed with charts and reports

## Technology Stack

### Frontend Layer
- **React 18**: UI rendering engine
- **Vite**: Build tooling and dev server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components
- **React Router v6**: Client-side routing

### Backend Infrastructure
- **AWS Lambda**: Serverless compute
- **AWS API Gateway**: RESTful endpoint management
- **AWS S3**: File and data storage

### External Integrations
- **Etherscan API**: Ethereum blockchain queries
- **Luno API**: South African crypto exchange data

## Component Architecture

### Layer 1: Pages
- Entry points for routes
- Handle page-level logic
- Connect to API services

### Layer 2: Components
- Reusable UI elements
- Dashboard widgets
- Analysis views
- Report generators

### Layer 3: UI Library
- shadcn/ui components
- Custom base components
- Design system tokens

### Layer 4: Utilities
- API calls
- Data transformation
- Helper functions

## State Management

- **React Hooks**: useState, useEffect, useCallback, useMemo
- **Context API**: For app-wide settings (future enhancement)
- **Local State**: Component-level data

## Data Models

```typescript
// Customer
{
  customer_id: string;
  first_name: string;
  last_name: string;
  average_risk_score: number;
  wallets: Wallet[];
  kyc_status: 'pending' | 'verified' | 'rejected';
}

// Wallet
{
  wallet_id: string;
  address: string;
  balance: number;
  risk_score: number;
  declared: boolean;
}

// Market Price
{
  pair: string;
  last_trade: number;
  bid: number;
  ask: number;
  change: number;
  trend: 'up' | 'down';
}
```

## API Communication

### Request/Response Pattern
```
Client → API Gateway → Lambda → External APIs → Response → Client
```

### Authentication
- Currently internal tool (no authentication)
- Environment-based access control

### Rate Limiting
- Implemented at Lambda level
- 100 requests per minute per customer
- Market data: 60-second cache

## Performance Considerations

- **Code Splitting**: Lazy load pages
- **Caching**: Market data cached for 60 seconds
- **Optimization**: Memoized components where needed
- **Build**: Vite provides optimized production builds

## Security Architecture

- **HTTPS Only**: All external API calls encrypted
- **Environment Variables**: Sensitive keys not in code
- **CORS Policy**: Restricted to authorized domains
- **Input Validation**: All user inputs sanitized
- **XSS Protection**: React's built-in protections
- **Rate Limiting**: Prevent abuse at API level

## Scalability

The architecture supports scaling through:
- AWS Lambda auto-scaling
- CloudFront CDN for frontend
- S3 for distributed file storage
- No database bottlenecks (stateless design)

## Future Enhancements

- Database integration for customer data persistence
- WebSocket connections for real-time updates
- Message queue for async processing
- Machine learning for risk prediction
- Multi-region deployment