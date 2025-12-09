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

class VALRClient:
    def __init__(self, api_key, api_secret):
        self.api_key = api_key
        self.api_secret = api_secret
        
    def _sign_request(self, path, method="GET", body=None):
        timestamp = int(time.time() * 1000)
        message = f"{timestamp}{method.upper()}{path}"
        
        # DEBUG: Show what's being signed
        print(f"DEBUG_SIGNATURE: Starting signature for path: {path}")
        print(f"DEBUG_SIGNATURE: Timestamp: {timestamp}")
        print(f"DEBUG_SIGNATURE: Method: {method}")
        print(f"DEBUG_SIGNATURE: Initial message: '{message}'")
        
        # CRITICAL FIX: Only include body in signature if it exists
        if body:
            body_json = json.dumps(body, separators=(',', ':'))
            message += body_json
            print(f"DEBUG_SIGNATURE: Added body: '{body_json}'")
        
        print(f"DEBUG_SIGNATURE: Final message to sign: '{message}'")
        print(f"DEBUG_SIGNATURE: API Key (first 10 chars): {self.api_key[:10]}...")
        print(f"DEBUG_SIGNATURE: API Secret (first 10 chars): {self.api_secret[:10]}...")
        
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        print(f"DEBUG_SIGNATURE: Generated signature (first 20 chars): {signature[:20]}...")
        
        # CRITICAL FIX: Only include Content-Type when there's a body
        headers = {
            'X-VALR-API-KEY': self.api_key,
            'X-VALR-SIGNATURE': signature,
            'X-VALR-TIMESTAMP': str(timestamp)
        }
        
        if body:
            headers['Content-Type'] = 'application/json'
        
        print(f"DEBUG_SIGNATURE: Final headers: { {k: (v[:20]+'...' if k == 'X-VALR-SIGNATURE' else v) for k, v in headers.items()} }")
        return headers
    
    def get_balances(self):
        """Get account balances from VALR"""
        print(f"DEBUG_GET_BALANCES: Starting get_balances()")
        path = "/v1/account/balances"
        # IMPORTANT: No body for GET request
        headers = self._sign_request(path, method="GET", body=None)
        
        print(f"DEBUG_GET_BALANCES: Making request to: {VALR_BASE_URL}{path}")
        print(f"DEBUG_GET_BALANCES: With headers: {headers}")
        
        try:
            response = requests.get(
                f"{VALR_BASE_URL}{path}",
                headers=headers,
                timeout=10
            )
            print(f"DEBUG_GET_BALANCES: Response status: {response.status_code}")
            print(f"DEBUG_GET_BALANCES: Response headers: {dict(response.headers)}")
            print(f"DEBUG_GET_BALANCES: Response body (first 500 chars): {response.text[:500]}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"VALR API Error: {e}")
            return {"error": str(e)}
    
    def get_ticker(self, pair="BTCZAR"):
        """Get market data (public endpoint, no auth needed)"""
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
        print(f"DEBUG_TRANSACTIONS: Starting get_transaction_history(limit={limit}, skip={skip})")
        path = f"/v1/account/transactionhistory?limit={limit}&skip={skip}"
        # IMPORTANT: No body for GET request
        headers = self._sign_request(path, method="GET", body=None)
        
        print(f"DEBUG_TRANSACTIONS: Making request to: {VALR_BASE_URL}{path}")
        
        try:
            response = requests.get(
                f"{VALR_BASE_URL}{path}",
                headers=headers,
                timeout=10
            )
            print(f"DEBUG_TRANSACTIONS: Response status: {response.status_code}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Transaction history error: {e}")
            return {"error": str(e)}

def lambda_handler(event, context):
    """Main Lambda handler"""
    try:
        print(f"DEBUG_LAMBDA: Received event: {event}")
        
        # Parse request
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'ticker')
        print(f"DEBUG_LAMBDA: Action requested: {action}")
        
        # Initialize VALR client
        valr = VALRClient(VALR_API_KEY, VALR_API_SECRET)
        
        # Route to appropriate function
        if action == 'balances':
            data = valr.get_balances()
        elif action == 'ticker':
            pair = body.get('pair', 'BTCZAR')
            data = valr.get_ticker(pair)
        elif action == 'transactions':
            limit = body.get('limit', 50)
            skip = body.get('skip', 0)
            data = valr.get_transaction_history(limit, skip)
        else:
            data = {'error': 'Invalid action'}
        
        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'data': data,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        print(f"DEBUG_LAMBDA: Error in handler: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }