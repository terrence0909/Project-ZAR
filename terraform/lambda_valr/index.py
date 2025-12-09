import json
import os
import boto3
import requests
import hmac
import hashlib
import time
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')

# VALR credentials
VALR_API_KEY = os.environ.get('VALR_API_KEY')
VALR_API_SECRET = os.environ.get('VALR_API_SECRET')
VALR_BASE_URL = os.environ.get('VALR_PROXY_URL', 'https://api.valr.com')

print(f"[INIT] VALR Client Initialized.")
print(f"[INIT] Base URL: {VALR_BASE_URL}")
print(f"[INIT] API Key present: {'Yes' if VALR_API_KEY else 'No'}")

# CORS Headers
CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}

class VALRClient:
    def __init__(self, api_key, api_secret):
        self.api_key = api_key
        self.api_secret = api_secret
        print(f"[VALRClient] Initialized with API Key starting with: {self.api_key[:8]}...")

    def _sign_request(self, path, method="GET", body=None):
        timestamp = int(time.time() * 1000)
        message = f"{timestamp}{method.upper()}{path}"

        if body:
            body_json = json.dumps(body, separators=(',', ':'))
            message += body_json
            print(f"[SIGNING] Body included in message: {body_json}")

        print(f"[SIGNING] Creating signature for request:")
        print(f"[SIGNING]   Timestamp: {timestamp}")
        print(f"[SIGNING]   Method: {method}")
        print(f"[SIGNING]   Path: {path}")
        print(f"[SIGNING]   Full message to sign: '{message}'")
        print(f"[SIGNING]   Secret used (first 8 chars): {self.api_secret[:8]}...")

        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()

        print(f"[SIGNING]   Generated signature: {signature[:20]}...")

        headers = {
            'X-VALR-API-KEY': self.api_key,
            'X-VALR-SIGNATURE': signature,
            'X-VALR-TIMESTAMP': str(timestamp)
        }

        # Only add Content-Type for requests with a body
        if body:
            headers['Content-Type'] = 'application/json'

        print(f"[SIGNING]   Headers to send: {headers}")
        return headers

    def get_balances(self):
        """Get account balances from VALR"""
        print(f"[GET_BALANCES] Starting request.")
        path = "/v1/account/balances"
        headers = self._sign_request(path, method="GET", body=None)

        full_url = f"{VALR_BASE_URL}{path}"
        print(f"[GET_BALANCES] Making GET request to: {full_url}")

        try:
            response = requests.get(full_url, headers=headers, timeout=10)
            print(f"[GET_BALANCES] Response received.")
            print(f"[GET_BALANCES]   Status Code: {response.status_code}")
            print(f"[GET_BALANCES]   Response Headers: {dict(response.headers)}")
            print(f"[GET_BALANCES]   Response Body (first 500 chars): {response.text[:500]}")

            response.raise_for_status()
            print(f"[GET_BALANCES] Request successful.")
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"[GET_BALANCES] ERROR: {e}")
            return {"error": str(e)}

    def get_ticker(self, pair="BTCZAR"):
        """Get market data"""
        print(f"[GET_TICKER] Getting ticker for {pair}")
        try:
            response = requests.get(
                f"{VALR_BASE_URL}/v1/public/{pair}/marketsummary",
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Market data error: {e}")
            return {"error": str(e)}

    def get_transaction_history(self, limit=50, skip=0):
        """Get transaction history"""
        print(f"[GET_TX] Getting transaction history. Limit: {limit}, Skip: {skip}")
        path = f"/v1/account/transactionhistory?limit={limit}&skip={skip}"
        headers = self._sign_request(path, method="GET", body=None)

        try:
            response = requests.get(
                f"{VALR_BASE_URL}{path}",
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Transaction history error: {e}")
            return {"error": str(e)}


def lambda_handler(event, context):
    """Main Lambda handler"""
    print(f"[HANDLER] Lambda invoked.")
    print(f"[HANDLER] Raw event received: {event}")

    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        print(f"[HANDLER] Handling CORS preflight request.")
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }

    try:
        # Parse request - handle both API Gateway and direct invoke formats
        if 'body' in event:
            # API Gateway format: event has 'body' as string
            print(f"[HANDLER] Parsing 'body' from API Gateway event.")
            body = json.loads(event.get('body', '{}'))
        else:
            # Direct invoke format: event IS the body
            print(f"[HANDLER] Using event as direct body.")
            body = event

        print(f"[HANDLER] Parsed body: {body}")
        action = body.get('action', 'ticker')
        print(f"[HANDLER] Action determined: '{action}'")

        # Initialize VALR client
        valr = VALRClient(VALR_API_KEY, VALR_API_SECRET)

        # Route to appropriate function
        if action == 'balances':
            print(f"[HANDLER] Routing to get_balances().")
            data = valr.get_balances()
        elif action == 'ticker':
            pair = body.get('pair', 'BTCZAR')
            print(f"[HANDLER] Routing to get_ticker({pair}).")
            data = valr.get_ticker(pair)
        elif action == 'transactions':
            limit = body.get('limit', 50)
            skip = body.get('skip', 0)
            print(f"[HANDLER] Routing to get_transaction_history({limit}, {skip}).")
            data = valr.get_transaction_history(limit, skip)
        else:
            data = {'error': 'Invalid action'}

        print(f"[HANDLER] Final data to return: {data}")

        # Return response with CORS headers
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': True,
                'data': data,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        print(f"[HANDLER] CRITICAL ERROR: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }


# For local testing
if __name__ == "__main__":
    # Test with mock event
    test_event = {
        'body': json.dumps({
            'action': 'ticker',
            'pair': 'BTCZAR'
        })
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))