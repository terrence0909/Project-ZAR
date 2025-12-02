#!/usr/bin/env python3
"""
Project ZAR - Luno Data Enrichment
Fetches wallet data from Luno API with proper HMAC authentication
"""

import json
import os
import boto3
import requests
import hmac
import hashlib
from datetime import datetime
from time import time

dynamodb = boto3.resource('dynamodb')
wallets_table = dynamodb.Table(os.environ['WALLETS_TABLE'])

LUNO_API_KEY_ID = os.environ['LUNO_API_KEY_ID']
LUNO_API_KEY_SECRET = os.environ['LUNO_API_KEY_SECRET']
LUNO_API_URL = "https://api.luno.com/api/1"

def get_luno_auth_headers(method, path, body=None):
    """
    Generate HMAC authentication headers for Luno API
    Luno requires: timestamp + HMAC-SHA256 signature
    """
    timestamp = str(int(time() * 1000))  # milliseconds since epoch
    
    # Create the string to sign: method + path + body + timestamp
    if body:
        auth_string = f"{method}{path}{body}{timestamp}"
    else:
        auth_string = f"{method}{path}{timestamp}"
    
    # Sign with HMAC-SHA256
    signature = hmac.new(
        LUNO_API_KEY_SECRET.encode(),
        auth_string.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return {
        "X-Auth-API-Key": LUNO_API_KEY_ID,
        "X-Auth-Signature": signature,
        "X-Auth-Timestamp": timestamp
    }

def lambda_handler(event, context):
    """
    Enriches wallet data with Luno information
    Can be called manually or via API
    """
    try:
        # Get wallet address and customer data from request
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        wallet_address = body.get('wallet_address')
        customer_profile = body.get('customer_profile', 'default')
        wallet_balances = body.get('wallet_balances', {})
        
        if not wallet_address:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'wallet_address required'})
            }
        
        # Fetch data from Luno with customer context
        luno_data = fetch_luno_data(wallet_address, customer_profile, wallet_balances)
        
        if luno_data:
            # Update wallet in DynamoDB with Luno data
            update_wallet_with_luno_data(wallet_address, luno_data)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'status': 'success',
                'wallet_address': wallet_address,
                'luno_data': luno_data,
                'timestamp': datetime.now().isoformat()
            })
        }
    
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def filter_relevant_tickers(all_tickers, customer_profile, wallet_balances):
    """
    Filter tickers to show only relevant pairs based on customer profile and holdings
    """
    print(f"=== DEBUG: filter_relevant_tickers ===")
    print(f"Profile: {customer_profile}")
    print(f"All tickers count: {len(all_tickers)}")
    
    # LUNO USES THESE NAMES (not BTCZAR, but XBTZAR):
    # XBTZAR = Bitcoin/ZAR
    # ETHZAR = Ethereum/ZAR  
    # XRPZAR = Ripple/ZAR
    # LTCZAR = Litecoin/ZAR
    # SOLZAR = Solana/ZAR
    # BCHZAR = Bitcoin Cash/ZAR
    
    # Profile-specific pairs - USE LUNO'S ACTUAL PAIR NAMES
    profile_pairs = {
        'vitalik': {'ETHZAR', 'XBTZAR'},  # Luno uses XBT not BTC
        'trader': {'XBTZAR', 'ETHZAR', 'XRPZAR', 'LTCZAR', 'BCHZAR', 'SOLZAR'},
        'nft_trader': {'ETHZAR', 'SOLZAR'},
        'default': {'XBTZAR', 'ETHZAR', 'XRPZAR'}
    }
    
    # Get profile-specific pairs
    relevant_pairs = profile_pairs.get(customer_profile, {'XBTZAR', 'ETHZAR', 'XRPZAR'})
    print(f"DEBUG: Relevant pairs for {customer_profile}: {relevant_pairs}")
    
    # Add ZAR pairs based on wallet holdings
    for asset, balance in wallet_balances.items():
        if balance and float(balance) > 0:
            # Map common names to Luno names
            asset_map = {
                'BTC': 'XBT',
                'ETH': 'ETH',
                'XRP': 'XRP', 
                'LTC': 'LTC',
                'SOL': 'SOL',
                'BCH': 'BCH',
                'ADA': 'ADA',
                'DOT': 'DOT'
            }
            luno_asset = asset_map.get(asset.upper(), asset.upper())
            zar_pair = f"{luno_asset}ZAR"
            relevant_pairs.add(zar_pair)
            print(f"DEBUG: Added {zar_pair} based on wallet holding: {asset}")
    
    print(f"DEBUG: Final relevant pairs: {relevant_pairs}")
    
    # Filter tickers to only relevant pairs
    filtered = []
    for ticker in all_tickers:
        pair = ticker.get('pair', '')
        if pair in relevant_pairs:
            filtered.append(ticker)
        else:
            print(f"DEBUG: Filtering out pair: {pair}")
    
    print(f"DEBUG: Filtered tickers count: {len(filtered)}")
    print(f"DEBUG: Filtered pairs: {[t['pair'] for t in filtered]}")
    
    # Sort by pair name for consistency
    filtered.sort(key=lambda x: x.get('pair', ''))
    
    return filtered

def fetch_luno_data(wallet_address, customer_profile='default', wallet_balances=None):
    """
    Fetch data from Luno API
    Returns customer-specific market data and ticker information
    """
    try:
        if wallet_balances is None:
            wallet_balances = {}
        
        print(f"=== DEBUG: fetch_luno_data called ===")
        print(f"Wallet: {wallet_address}")
        print(f"Profile: {customer_profile}")
        print(f"Balances: {wallet_balances}")
        
        # Get public ticker data (no auth needed)
        print("Fetching public market tickers from Luno...")
        ticker_response = requests.get(
            f"{LUNO_API_URL}/tickers",
            timeout=10
        )
        
        print(f"Ticker response status: {ticker_response.status_code}")
        
        if ticker_response.status_code != 200:
            print(f"Ticker API error: {ticker_response.status_code}")
            print(f"Response: {ticker_response.text}")
            return None
        
        ticker_data = ticker_response.json()
        all_tickers = ticker_data.get('tickers', [])
        print(f"✓ Tickers fetched successfully ({len(all_tickers)} total)")
        
        # DEBUG: Show what pairs Luno actually returns
        all_pair_names = [t.get('pair', '') for t in all_tickers]
        print(f"DEBUG: Available Luno pairs: {set(all_pair_names)}")
        
        # Filter tickers based on customer profile and holdings
        filtered_tickers = filter_relevant_tickers(all_tickers, customer_profile, wallet_balances)
        print(f"✓ Filtered to {len(filtered_tickers)} relevant pairs for profile: {customer_profile}")
        
        # Try to get account info with proper auth
        print("Fetching account info from Luno with HMAC auth...")
        account_path = "/accounts"
        headers = get_luno_auth_headers("GET", account_path)
        headers["Content-Type"] = "application/json"
        
        account_response = requests.get(
            f"{LUNO_API_URL}{account_path}",
            headers=headers,
            timeout=10
        )
        
        print(f"Account response status: {account_response.status_code}")
        
        account_data = {}
        if account_response.status_code == 200:
            account_data = account_response.json()
            print(f"✓ Account data fetched")
        else:
            print(f"Account API error: {account_response.status_code}")
            print(f"Response: {account_response.text}")
        
        # Combine all data
        luno_data = {
            'source': 'luno_api',
            'wallet_address': wallet_address,
            'market_tickers': filtered_tickers,
            'account_info': account_data.get('accounts', []) if account_data else [],
            'exchange': 'Luno',
            'last_updated': datetime.now().isoformat(),
            'data_source': 'live'
        }
        
        print(f"✓ Luno data compiled for {wallet_address}")
        return luno_data
    
    except requests.exceptions.RequestException as e:
        print(f"API request error: {e}")
        return None
    except Exception as e:
        print(f"Error fetching Luno data: {e}")
        return None

def update_wallet_with_luno_data(wallet_address, luno_data):
    """
    Update wallet in DynamoDB with Luno enrichment data
    """
    try:
        # Query for wallet by address
        response = wallets_table.query(
            IndexName='wallet_address-index',
            KeyConditionExpression='wallet_address = :addr',
            ExpressionAttributeValues={':addr': wallet_address}
        )
        
        if response['Items']:
            wallet = response['Items'][0]
            wallet_id = wallet['wallet_id']
            
            # Update wallet with Luno data
            wallets_table.update_item(
                Key={'wallet_id': wallet_id},
                UpdateExpression='SET luno_data = :data, last_enriched = :ts',
                ExpressionAttributeValues={
                    ':data': luno_data,
                    ':ts': datetime.now().isoformat()
                }
            )
            print(f"✓ Wallet {wallet_id} updated with Luno data")
        else:
            print(f"Wallet {wallet_address} not found in DynamoDB")
    
    except Exception as e:
        print(f"Error updating wallet: {e}")

if __name__ == "__main__":
    # Local test - REMOVE REAL CREDENTIALS BEFORE COMMITTING
    os.environ['WALLETS_TABLE'] = 'project-zar-wallets'
    os.environ['LUNO_API_KEY_ID'] = 'test_key'
    os.environ['LUNO_API_KEY_SECRET'] = 'test_secret'
    
    test_event = {
        'body': json.dumps({
            'wallet_address': '0x742d35Cc6634C0532925a3b8D1234567890ABCDEF',
            'customer_profile': 'vitalik',
            'wallet_balances': {'ETH': '0', 'BTC': '0'}
        })
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))