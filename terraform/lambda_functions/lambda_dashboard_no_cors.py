#!/usr/bin/env python3
"""
Project ZAR - Dashboard Data Aggregation - NO CORS HEADERS
"""

import json
import os
import boto3
import urllib.request
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
customers_table = dynamodb.Table(os.environ['CUSTOMERS_TABLE'])
wallets_table = dynamodb.Table(os.environ['WALLETS_TABLE'])

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_customer_count():
    response = customers_table.scan(Select='COUNT')
    return response.get('Count', 0)

def get_wallet_metrics():
    try:
        response = wallets_table.scan()
        items = response.get('Items', [])
        
        total_wallets = len(items)
        high_risk_count = 0
        total_exposure_zar = 0
        
        for wallet in items:
            risk_score = wallet.get('risk_score', 0) or wallet.get('combined_risk_score', 0)
            if risk_score > 70:
                high_risk_count += 1
        
        return {
            'total_wallets': total_wallets,
            'high_risk_count': high_risk_count,
            'total_exposure_zar': total_exposure_zar
        }
    except Exception as e:
        print(f"Error: {e}")
        return {'total_wallets': 0, 'high_risk_count': 0, 'total_exposure_zar': 0}

def get_risk_distribution():
    try:
        response = wallets_table.scan()
        items = response.get('Items', [])
        
        low = medium = high = 0
        
        for wallet in items:
            risk_score = wallet.get('risk_score', 0) or wallet.get('combined_risk_score', 0) or 0
            
            if risk_score <= 30:
                low += 1
            elif risk_score <= 70:
                medium += 1
            else:
                high += 1
        
        return {'low': low, 'medium': medium, 'high': high}
    except Exception as e:
        print(f"Error: {e}")
        return {'low': 0, 'medium': 0, 'high': 0}

def get_market_prices():
    try:
        url = "https://api.luno.com/api/1/tickers"
        req = urllib.request.Request(url, headers={'User-Agent': 'ProjectZAR/1.0'})
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            tickers = data.get('tickers', [])
            
            zar_pairs = ['ETHZAR', 'XBTZAR', 'SOLZAR', 'XRPZAR', 'LTCZAR', 'BCHZAR']
            formatted_prices = []
            
            for ticker in tickers:
                pair = ticker.get('pair', '')
                if pair in zar_pairs:
                    last_trade = float(ticker.get('last_trade', 0))
                    bid = float(ticker.get('bid', 0))
                    ask = float(ticker.get('ask', 0))
                    mid_price = (bid + ask) / 2 if bid and ask else last_trade
                    change = round((last_trade - mid_price) / mid_price * 100, 2) if mid_price else 0.0
                    
                    formatted_prices.append({
                        'pair': pair,
                        'pair_display': pair.replace('XBT', 'BTC').replace('ZAR', '/ZAR'),
                        'last_trade': last_trade,
                        'bid': bid,
                        'ask': ask,
                        'change': change,
                        'trend': 'up' if change >= 0 else 'down',
                        'volume': ticker.get('rolling_24_hour_volume', '0'),
                        'timestamp': ticker.get('timestamp')
                    })
            
            formatted_prices.sort(key=lambda x: float(x.get('volume', 0)) if x.get('volume') else 0, reverse=True)
            return formatted_prices[:6]
            
    except Exception as e:
        print(f"Error: {e}")
        return get_fallback_prices()

def get_fallback_prices():
    return [
        {'pair': 'ETHZAR', 'pair_display': 'ETH/ZAR', 'last_trade': 47418.0, 'change': 0.25, 'trend': 'up'},
        {'pair': 'XBTZAR', 'pair_display': 'BTC/ZAR', 'last_trade': 1456776.0, 'change': 0.05, 'trend': 'up'},
        {'pair': 'SOLZAR', 'pair_display': 'SOL/ZAR', 'last_trade': 2123.81, 'change': -0.51, 'trend': 'down'},
    ]

def get_recent_alerts(limit=10):
    return [
        {
            'id': '1',
            'timestamp': datetime.now().isoformat(),
            'customer_name': 'Thandiwe Bhengu',
            'wallet_address': '0x4f9090aae28b8a3dcecc2fafcdef9f3778915e84',
            'alert_type': 'Large Deposit',
            'severity': 'high',
            'status': 'pending',
            'description': 'Large deposit detected: R 250,000'
        }
    ]

def lambda_handler(event, context):
    try:
        customer_count = get_customer_count()
        wallet_metrics = get_wallet_metrics()
        risk_dist = get_risk_distribution()
        recent_alerts = get_recent_alerts()
        market_prices = get_market_prices()
        
        response_data = {
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'kpi_metrics': {
                'total_customers': customer_count,
                'high_risk_customers': wallet_metrics['high_risk_count'],
                'total_crypto_exposure_zar': wallet_metrics['total_exposure_zar'],
                'avg_crypto_percentage': 18.3,
                'total_wallets': wallet_metrics['total_wallets']
            },
            'risk_distribution': risk_dist,
            'recent_alerts': recent_alerts,
            'market_prices': market_prices
        }
        
        # FIX: NO CORS HEADERS - Let AWS Lambda Function URL handle it
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
                # NO Access-Control-Allow-Origin header here!
            },
            'body': json.dumps(response_data, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
                # NO CORS headers here either!
            },
            'body': json.dumps({'error': str(e)})
        }
