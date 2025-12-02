#!/usr/bin/env python3
"""
Project ZAR - Etherscan Data Enrichment
Fetches on-chain transaction data for wallets
"""

import json
import os
import boto3
import requests
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
wallets_table = dynamodb.Table(os.environ['WALLETS_TABLE'])

ETHERSCAN_API_KEY = os.environ.get('ETHERSCAN_API_KEY')
ETHERSCAN_API_URL = "https://api.etherscan.io/api"

def lambda_handler(event, context):
    """Fetch on-chain transaction data from Etherscan"""
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        wallet_address = body.get('wallet_address')
        
        if not wallet_address:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'wallet_address required'})
            }
        
        # Fetch on-chain data
        etherscan_data = fetch_etherscan_data(wallet_address)
        
        if etherscan_data:
            update_wallet_with_etherscan_data(wallet_address, etherscan_data)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'status': 'success',
                'wallet_address': wallet_address,
                'etherscan_data': etherscan_data,
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

def fetch_etherscan_data(wallet_address):
    """Fetch wallet data from Etherscan"""
    try:
        print(f"Fetching Etherscan data for {wallet_address}...")
        
        # Get ETH balance
        balance_response = requests.get(
            ETHERSCAN_API_URL,
            params={
                'module': 'account',
                'action': 'balance',
                'address': wallet_address,
                'apikey': ETHERSCAN_API_KEY,
                'tag': 'latest'
            },
            timeout=10
        )
        
        if balance_response.status_code != 200:
            print(f"Balance API error: {balance_response.status_code}")
            return None
        
        balance_data = balance_response.json()
        
        # Handle result safely
        try:
            balance_result = balance_data.get('result', '0')
            if isinstance(balance_result, str):
                eth_balance = int(balance_result) / 1e18
            else:
                eth_balance = 0
        except (ValueError, TypeError) as e:
            print(f"Error parsing balance: {e}, result was: {balance_data.get('result')}")
            eth_balance = 0
        
        print(f"✓ Balance: {eth_balance} ETH")
        
        # Get transaction history
        print("Fetching transaction history...")
        tx_response = requests.get(
            ETHERSCAN_API_URL,
            params={
                'module': 'account',
                'action': 'txlist',
                'address': wallet_address,
                'startblock': 0,
                'endblock': 99999999,
                'sort': 'desc',
                'apikey': ETHERSCAN_API_KEY
            },
            timeout=10
        )
        
        if tx_response.status_code != 200:
            print(f"Transaction API error: {tx_response.status_code}")
            transactions = []
        else:
            tx_data = tx_response.json()
            transactions = tx_data.get('result', []) if isinstance(tx_data.get('result'), list) else []
            transactions = transactions[:20]  # Get last 20
        
        print(f"✓ Transactions: {len(transactions)} found")
        
        # Analyze transactions for risk
        risk_indicators = analyze_transactions(transactions, wallet_address)
        
        etherscan_data = {
            'source': 'etherscan',
            'wallet_address': wallet_address,
            'eth_balance': eth_balance,
            'transaction_count': len(transactions),
            'transactions': [
                {
                    'hash': tx.get('hash'),
                    'from': tx.get('from'),
                    'to': tx.get('to'),
                    'value': float(int(tx.get('value', 0)) / 1e18),
                    'timestamp': datetime.fromtimestamp(int(tx.get('timeStamp', 0))).isoformat() if tx.get('timeStamp') else 'Unknown',
                    'status': tx.get('isError') == '0'
                }
                for tx in transactions
            ],
            'risk_indicators': risk_indicators,
            'last_updated': datetime.now().isoformat(),
            'data_source': 'live'
        }
        
        return etherscan_data
    
    except requests.exceptions.RequestException as e:
        print(f"API request error: {e}")
        return None
    except Exception as e:
        print(f"Error fetching Etherscan data: {e}")
        import traceback
        traceback.print_exc()
        return None

def analyze_transactions(transactions, wallet_address):
    """Analyze transaction patterns for risk"""
    risk_indicators = {
        'high_frequency_trading': False,
        'multiple_exchanges': False,
        'large_transactions': False,
        'suspicious_patterns': []
    }
    
    if len(transactions) > 50:
        risk_indicators['high_frequency_trading'] = True
        risk_indicators['suspicious_patterns'].append('High transaction frequency')
    
    large_tx_count = 0
    for tx in transactions:
        try:
            value = float(int(tx.get('value', 0)) / 1e18)
            if value > 10:
                large_tx_count += 1
        except:
            pass
    
    if large_tx_count > 5:
        risk_indicators['large_transactions'] = True
        risk_indicators['suspicious_patterns'].append(f'{large_tx_count} large transactions')
    
    return risk_indicators

def update_wallet_with_etherscan_data(wallet_address, etherscan_data):
    """Update wallet in DynamoDB with Etherscan data"""
    try:
        response = wallets_table.query(
            IndexName='wallet_address-index',
            KeyConditionExpression='wallet_address = :addr',
            ExpressionAttributeValues={':addr': wallet_address}
        )
        
        if response['Items']:
            wallet = response['Items'][0]
            wallet_id = wallet['wallet_id']
            
            wallets_table.update_item(
                Key={'wallet_id': wallet_id},
                UpdateExpression='SET etherscan_data = :data, last_enriched = :ts',
                ExpressionAttributeValues={
                    ':data': etherscan_data,
                    ':ts': datetime.now().isoformat()
                }
            )
            print(f"✓ Wallet {wallet_id} updated with Etherscan data")
    
    except Exception as e:
        print(f"Error updating wallet: {e}")