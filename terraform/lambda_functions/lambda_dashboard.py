#!/usr/bin/env python3
"""
Project ZAR - Dashboard Data Aggregation
Provides aggregated metrics for the dashboard UI
"""

import json
import os
import boto3
import requests
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
    """Get total number of customers"""
    response = customers_table.scan(Select='COUNT')
    return response.get('Count', 0)

def get_wallet_metrics():
    """Get aggregated wallet metrics"""
    try:
        response = wallets_table.scan()
        items = response.get('Items', [])
        
        total_wallets = len(items)
        high_risk_count = 0
        total_exposure_zar = 0
        
        for wallet in items:
            # Count high risk (risk_score > 70)
            risk_score = wallet.get('risk_score', 0) or wallet.get('combined_risk_score', 0)
            if risk_score > 70:
                high_risk_count += 1
            
            # Calculate crypto exposure in ZAR
            etherscan_data = wallet.get('etherscan_data', {})
            luno_data = wallet.get('luno_data', {})
            
            # Get ETH balance and convert to ZAR
            eth_balance = etherscan_data.get('eth_balance', 0)
            if isinstance(eth_balance, str):
                try:
                    eth_balance = float(eth_balance)
                except:
                    eth_balance = 0
            
            eth_zar_price = get_eth_zar_price(luno_data)
            eth_value_zar = eth_balance * eth_zar_price
            
            total_exposure_zar += eth_value_zar
        
        return {
            'total_wallets': total_wallets,
            'high_risk_count': high_risk_count,
            'total_exposure_zar': total_exposure_zar
        }
    except Exception as e:
        print(f"Error getting wallet metrics: {e}")
        return {'total_wallets': 0, 'high_risk_count': 0, 'total_exposure_zar': 0}

def get_eth_zar_price(luno_data):
    """Extract ETH/ZAR price from Luno data"""
    try:
        if isinstance(luno_data, dict):
            market_tickers = luno_data.get('market_tickers', [])
            for ticker in market_tickers:
                if ticker.get('pair') == 'ETHZAR':
                    last_trade = ticker.get('last_trade', '0')
                    return float(last_trade)
    except:
        pass
    return 48000.0

def get_risk_distribution():
    """Get distribution of risk scores"""
    try:
        response = wallets_table.scan()
        items = response.get('Items', [])
        
        low = medium = high = 0
        
        for wallet in items:
            # Try different possible field names
            risk_score = (
                wallet.get('risk_score', 0) or 
                wallet.get('combined_risk_score', 0) or 
                0
            )
            
            if risk_score <= 30:
                low += 1
            elif risk_score <= 70:
                medium += 1
            else:
                high += 1
        
        print(f"DEBUG: Risk distribution - Low: {low}, Medium: {medium}, High: {high}")
        return {
            'low': low,
            'medium': medium,
            'high': high
        }
    except Exception as e:
        print(f"Error getting risk distribution: {e}")
        return {'low': 0, 'medium': 0, 'high': 0}

def get_market_prices():
    """Get live market prices from Luno API"""
    try:
        print("Fetching live market prices from Luno...")
        response = requests.get(
            "https://api.luno.com/api/1/tickers",
            timeout=10
        )
        
        if response.status_code == 200:
            tickers = response.json().get('tickers', [])
            print(f"Got {len(tickers)} tickers from Luno")
            
            # Filter and format relevant ZAR pairs
            zar_pairs = ['ETHZAR', 'XBTZAR', 'SOLZAR', 'XRPZAR', 'LTCZAR', 'BCHZAR']
            formatted_prices = []
            
            for ticker in tickers:
                pair = ticker.get('pair', '')
                if pair in zar_pairs:
                    last_trade = float(ticker.get('last_trade', 0))
                    rolling_24h = ticker.get('rolling_24_hour_volume', '0')
                    
                    # Calculate 24h change if we have bid/ask
                    bid = float(ticker.get('bid', 0))
                    ask = float(ticker.get('ask', 0))
                    mid_price = (bid + ask) / 2 if bid and ask else last_trade
                    
                    # Simple mock change calculation (Luno doesn't provide % change directly)
                    change = round((last_trade - mid_price) / mid_price * 100, 2) if mid_price else 0.0
                    
                    formatted_prices.append({
                        'pair': pair,
                        'pair_display': pair.replace('XBT', 'BTC').replace('ZAR', '/ZAR'),
                        'last_trade': last_trade,
                        'bid': bid,
                        'ask': ask,
                        'change': change,
                        'trend': 'up' if change >= 0 else 'down',
                        'volume': rolling_24h,
                        'timestamp': ticker.get('timestamp')
                    })
            
            # Sort by trading volume
            formatted_prices.sort(key=lambda x: float(x.get('volume', 0)) if x.get('volume') else 0, reverse=True)
            return formatted_prices[:6]  # Return top 6
            
    except Exception as e:
        print(f"Error fetching Luno prices: {e}")
    
    # Fallback mock data
    return get_fallback_prices()

def get_fallback_prices():
    """Fallback prices when Luno API fails"""
    return [
        {
            'pair': 'ETHZAR',
            'pair_display': 'ETH/ZAR',
            'last_trade': 48690.00,
            'change': 1.2,
            'trend': 'up',
            'volume': '133.80152'
        },
        {
            'pair': 'XBTZAR',
            'pair_display': 'BTC/ZAR',
            'last_trade': 1481003.00,
            'change': 2.1,
            'trend': 'up',
            'volume': '33.547426'
        },
        {
            'pair': 'SOLZAR',
            'pair_display': 'SOL/ZAR',
            'last_trade': 2180.00,
            'change': -0.5,
            'trend': 'down',
            'volume': '900.6629'
        },
        {
            'pair': 'XRPZAR',
            'pair_display': 'XRP/ZAR',
            'last_trade': 34.96,
            'change': 0.3,
            'trend': 'up',
            'volume': '779398.00'
        },
        {
            'pair': 'LTCZAR',
            'pair_display': 'LTC/ZAR',
            'last_trade': 1450.00,
            'change': -1.1,
            'trend': 'down',
            'volume': '45.231'
        },
        {
            'pair': 'BCHZAR',
            'pair_display': 'BCH/ZAR',
            'last_trade': 5320.00,
            'change': 0.8,
            'trend': 'up',
            'volume': '12.456'
        }
    ]

def get_recent_alerts(limit=10):
    """Get recent alerts/activities"""
    # TODO: Implement real alert system
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
    """Main Lambda handler for dashboard data"""
    print(f"DEBUG: Dashboard Lambda called")
    
    try:
        # Get all metrics
        customer_count = get_customer_count()
        wallet_metrics = get_wallet_metrics()
        risk_dist = get_risk_distribution()
        recent_alerts = get_recent_alerts()
        market_prices = get_market_prices()
        
        # Calculate average crypto percentage (placeholder)
        avg_crypto_percentage = 18.3
        if customer_count > 0 and wallet_metrics['total_exposure_zar'] > 0:
            # This would require total assets data
            pass
        
        # Prepare response
        response_data = {
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'kpi_metrics': {
                'total_customers': customer_count,
                'high_risk_customers': wallet_metrics['high_risk_count'],
                'total_crypto_exposure_zar': wallet_metrics['total_exposure_zar'],
                'avg_crypto_percentage': avg_crypto_percentage,
                'total_wallets': wallet_metrics['total_wallets']
            },
            'risk_distribution': risk_dist,
            'recent_alerts': recent_alerts,
            'market_prices': market_prices
        }
        
        print(f"DEBUG: Returning data with {len(market_prices)} market prices")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"Dashboard Lambda error: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }

if __name__ == "__main__":
    # Local testing
    os.environ['CUSTOMERS_TABLE'] = 'project-zar-customers'
    os.environ['WALLETS_TABLE'] = 'project-zar-wallets'
    result = lambda_handler({}, None)
    print(json.dumps(json.loads(result['body']), indent=2))