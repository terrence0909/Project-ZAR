# API Documentation

## Overview

Project ZAR integrates with multiple APIs for cryptocurrency data and customer management. All endpoints support JSON requests and responses.

## AWS Lambda Endpoints

Base URL: `https://{api-endpoint}.execute-api.us-east-1.amazonaws.com/dev`

### 1. Get Customers

Retrieve all customers and their risk profiles.

**Endpoint**: `POST /customers`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "query": "",
  "query_type": "get_customers"
}
```

**Response** (200 OK):
```json
{
  "customers": [
    {
      "customer_id": "CUST001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+27123456789",
      "date_of_birth": "1990-05-15",
      "nationality": "ZA",
      "id_number": "9005151234567",
      "average_risk_score": 45,
      "wallet_count": 3,
      "kyc_status": "verified",
      "wallets": [
        {
          "wallet_id": "W001",
          "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f84bAF",
          "balance": 2.5,
          "declared": true,
          "risk_score": 25,
          "last_activity": "2024-12-01T14:30:00Z"
        },
        {
          "wallet_id": "W002",
          "address": "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
          "balance": 0.75,
          "declared": false,
          "risk_score": 65,
          "last_activity": "2024-11-28T09:15:00Z"
        }
      ],
      "last_updated": "2024-12-01T15:00:00Z",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Error Response** (500):
```json
{
  "error": "Failed to fetch customers",
  "message": "Database connection error"
}
```

---

### 2. Upload XML Data

Bulk import customer data from XML file.

**Endpoint**: `POST /upload-xml`

**Headers**:
```
Content-Type: multipart/form-data
```

**Request**:
- `file`: XML file (multipart)

**XML Format**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<customers>
  <customer>
    <id>CUST001</id>
    <first_name>John</first_name>
    <last_name>Doe</last_name>
    <email>john@example.com</email>
    <phone>+27123456789</phone>
    <id_number>9005151234567</id_number>
    <wallets>
      <wallet>
        <address>0x742d35Cc6634C0532925a3b844Bc9e7595f84bAF</address>
        <declared>true</declared>
      </wallet>
      <wallet>
        <address>0x8ba1f109551bD432803012645Ac136ddd64DBA72</address>
        <declared>false</declared>
      </wallet>
    </wallets>
  </customer>
</customers>
```

**Response** (200 OK):
```json
{
  "success": true,
  "imported": 1,
  "failed": 0,
  "message": "Successfully imported 1 customers",
  "details": [
    {
      "customer_id": "CUST001",
      "status": "imported",
      "wallets_added": 2
    }
  ]
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Invalid XML format",
  "message": "Missing required field: first_name"
}
```

---

### 3. Get Wallet Analysis

Get detailed analysis for a specific wallet.

**Endpoint**: `POST /wallets`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f84bAF"
}
```

**Response** (200 OK):
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f84bAF",
  "balance": 2.5,
  "balance_usd": 4625.50,
  "transactions": {
    "total": 156,
    "sent": 78,
    "received": 78
  },
  "first_transaction": "2020-01-15T10:30:00Z",
  "last_transaction": "2024-12-01T14:20:00Z",
  "tokens": [
    {
      "symbol": "USDC",
      "name": "USD Coin",
      "balance": 1000,
      "value": 1000,
      "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    {
      "symbol": "DAI",
      "name": "Dai Stablecoin",
      "balance": 500,
      "value": 500,
      "contract": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    }
  ],
  "risk_score": 25,
  "risk_level": "low",
  "risk_flags": [],
  "mixer_usage": false,
  "sanctioned": false,
  "high_risk_jurisdiction": false
}
```

---

### 4. Search Customers

Search customers by name, email, or ID.

**Endpoint**: `POST /customers/search`

**Request Body**:
```json
{
  "query": "john",
  "search_type": "name"
}
```

**Response** (200 OK):
```json
{
  "results": [
    {
      "customer_id": "CUST001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "risk_score": 45
    }
  ],
  "total": 1
}
```

---

## Luno API Integration

Base URL: `https://6duobrslvyityfkazhdl2e4cpu0qqacs.lambda-url.us-east-1.on.aws/`

### Get Market Prices

Fetch live cryptocurrency prices in ZAR.

**Endpoint**: `POST /`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{}
```

**Response** (200 OK):
```json
{
  "market_prices": [
    {
      "pair": "ETHZAR",
      "pair_display": "ETH/ZAR",
      "last_trade": 45678.50,
      "bid": 45600,
      "ask": 45700,
      "change": 2.5,
      "trend": "up",
      "volume": "1234.56",
      "timestamp": 1701432000
    },
    {
      "pair": "XBTZAR",
      "pair_display": "XBT/ZAR",
      "last_trade": 1156789.00,
      "bid": 1156700,
      "ask": 1156900,
      "change": -1.2,
      "trend": "down",
      "volume": "5678.90",
      "timestamp": 1701432000
    },
    {
      "pair": "SOLZAR",
      "pair_display": "SOL/ZAR",
      "last_trade": 3456.25,
      "bid": 3450,
      "ask": 3465,
      "change": 5.8,
      "trend": "up",
      "volume": "234.56",
      "timestamp": 1701432000
    }
  ]
}
```

---

## Etherscan API Integration

Base URL: `https://api.etherscan.io/api`

### Get Account Balance

Get ETH balance for an address.

**Endpoint**: `GET /api`

**Query Parameters**:
```
module=account
action=balance
address=0x742d35Cc6634C0532925a3b844Bc9e7595f84bAF
tag=latest
apikey=YOUR_APIKEY
```

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": "2500000000000000000"
}
```

### Get Transaction List

Get transactions for an address.

**Endpoint**: `GET /api`

**Query Parameters**:
```
module=account
action=txlist
address=0x742d35Cc6634C0532925a3b844Bc9e7595f84bAF
startblock=0
endblock=99999999
apikey=YOUR_APIKEY
```

**Response**:
```json
{
  "status": "1",
  "message": "OK",
  "result": [
    {
      "hash": "0x123abc...",
      "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f84bAF",
      "to": "0xRecipientAddress",
      "value": "1000000000000000000",
      "gas": "21000",
      "gasPrice": "50000000000",
      "timeStamp": "1701432000",
      "blockNumber": "18878945"
    }
  ]
}
```

---

## Error Handling

All endpoints follow standard HTTP status codes:

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Data retrieved successfully |
| 400 | Bad Request | Invalid parameters or format |
| 401 | Unauthorized | Invalid API key |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |

**Error Response Format**:
```json
{
  "error": "Error code",
  "message": "Human-readable error message",
  "timestamp": "2024-12-01T15:00:00Z"
}
```

---

## Rate Limiting

- **Customers API**: 100 requests/minute per customer
- **Wallet Analysis**: 50 requests/minute per wallet
- **Market Prices**: Cached for 60 seconds
- **Etherscan**: 5 calls/second (free tier)

---

## Authentication

Currently, endpoints are accessible without authentication. For production:

```javascript
// Add Bearer token to requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};
```

---

## Examples

### cURL

```bash
# Get all customers
curl -X POST https://your-endpoint.execute-api.us-east-1.amazonaws.com/dev/customers \
  -H "Content-Type: application/json" \
  -d '{
    "query": "",
    "query_type": "get_customers"
  }'

# Get market prices
curl -X POST https://6duobrslvyityfkazhdl2e4cpu0qqacs.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

### JavaScript/Fetch

```javascript
// Get customers
const response = await fetch('YOUR_API_ENDPOINT/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: '',
    query_type: 'get_customers'
  })
});

const data = await response.json();
console.log(data);
```

### Python/Requests

```python
import requests

# Get customers
response = requests.post(
  'YOUR_API_ENDPOINT/customers',
  json={
    'query': '',
    'query_type': 'get_customers'
  }
)

print(response.json())
```

---

## API Changelog

### Version 1.0 (Current)
- Initial API release
- Customers endpoint
- Wallet analysis
- Market prices integration
- XML import functionality