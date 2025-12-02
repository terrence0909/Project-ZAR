import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

customers_table = dynamodb.Table(os.environ['CUSTOMERS_TABLE'])
wallets_table = dynamodb.Table(os.environ['WALLETS_TABLE'])
transactions_table = dynamodb.Table(os.environ['TRANSACTIONS_TABLE'])
risk_registry_table = dynamodb.Table(os.environ['RISK_REGISTRY_TABLE'])
wallet_clusters_table = dynamodb.Table(os.environ['WALLET_CLUSTERS_TABLE'])

def determine_customer_profile(customer_id, wallets):
    """Determine customer profile based on ID and wallet characteristics"""
    if 'vitalik' in customer_id.lower():
        return 'vitalik'
    elif 'coinbase' in customer_id.lower():
        return 'trader'
    elif 'opensea' in customer_id.lower():
        return 'nft_trader'
    else:
        return 'default'

def extract_wallet_balances(wallets):
    """Extract asset balances from wallets"""
    balances = {}
    for wallet in wallets:
        balance = wallet.get('balance', 0)
        if balance and float(balance) > 0:
            # Infer asset type from blockchain or wallet type
            blockchain = wallet.get('blockchain', 'ETH').upper()
            if blockchain == 'ETHEREUM':
                blockchain = 'ETH'
            balances[blockchain] = balance
    return balances

def enrich_with_luno(wallet_address, customer_profile='default', wallet_balances=None):
    """Call Luno enrichment Lambda to get exchange data"""
    try:
        if wallet_balances is None:
            wallet_balances = {}
        
        print(f"Enriching wallet {wallet_address} with Luno data...")
        print(f"  Profile: {customer_profile}")
        print(f"  Balances: {wallet_balances}")
        
        response = lambda_client.invoke(
            FunctionName='project-zar-luno-enrich',
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'body': json.dumps({
                    'wallet_address': wallet_address,
                    'customer_profile': customer_profile,
                    'wallet_balances': wallet_balances
                })
            })
        )
        
        result = json.loads(response['Payload'].read().decode())
        body = json.loads(result['body'])
        luno_data = body.get('luno_data')
        
        if luno_data:
            print(f"✓ Luno data retrieved: {len(luno_data.get('market_tickers', []))} tickers")
        
        return luno_data
    except Exception as e:
        print(f"Luno enrichment error: {e}")
        return None

def enrich_with_etherscan(wallet_address):
    """Call Etherscan enrichment Lambda to get on-chain data"""
    try:
        print(f"Enriching wallet {wallet_address} with Etherscan data...")
        response = lambda_client.invoke(
            FunctionName='project-zar-etherscan-enrichment',
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'body': json.dumps({'wallet_address': wallet_address})
            })
        )
        
        result = json.loads(response['Payload'].read().decode())
        body = json.loads(result['body'])
        etherscan_data = body.get('etherscan_data')
        
        if etherscan_data:
            print(f"✓ Etherscan data retrieved: {etherscan_data.get('transaction_count', 0)} transactions")
        
        return etherscan_data
    except Exception as e:
        print(f"Etherscan enrichment error: {e}")
        return None

def calculate_combined_risk(wallet, luno_data, etherscan_data):
    """Calculate risk score combining blockchain and exchange data"""
    risk_score = wallet.get('risk_score', 0)
    
    # Luno exchange risk factors
    if luno_data and luno_data.get('market_tickers'):
        tickers = luno_data['market_tickers']
        
        # High volume trading patterns can indicate suspicious activity
        high_volume_count = 0
        for ticker in tickers:
            try:
                volume = float(ticker.get('rolling_24_hour_volume', 0))
                if volume > 5000:
                    high_volume_count += 1
            except:
                pass
        
        # If trading on multiple high-volume pairs, increase risk
        if high_volume_count > 3:
            risk_score += 15
        elif high_volume_count > 1:
            risk_score += 5
    
    # Etherscan on-chain risk factors
    if etherscan_data:
        risk_indicators = etherscan_data.get('risk_indicators', {})
        
        if risk_indicators.get('high_frequency_trading'):
            risk_score += 20
        if risk_indicators.get('large_transactions'):
            risk_score += 15
        
        # Large balance = more suspicious if combined with high activity
        if etherscan_data.get('eth_balance', 0) > 10 and etherscan_data.get('transaction_count', 0) > 20:
            risk_score += 10
    
    return min(risk_score, 100)

def lambda_handler(event, context):
    try:
        print("Raw event received:", json.dumps(event))
        
        # Handle both direct invocation and API Gateway invocation
        if 'body' in event:
            # API Gateway invocation - body is stringified JSON
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        else:
            # Direct Lambda invocation - event is the body directly
            body = event
        
        print("Parsed body:", json.dumps(body))
        
        # Extract query parameters
        query = body.get('query') or body.get('wallet_address')
        query_type = body.get('query_type', 'wallet_address')
        
        print(f"Query: {query}, Query Type: {query_type}")
        
        if not query:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'query or wallet_address parameter is required'})
            }
        
        # Search by SA ID
        if query_type == 'sa_id':
            response = customers_table.query(
                IndexName='sa_id-index',
                KeyConditionExpression='sa_id = :sa_id',
                ExpressionAttributeValues={':sa_id': query}
            )
        # Search by wallet address
        else:
            response = wallets_table.query(
                IndexName='wallet_address-index',
                KeyConditionExpression='wallet_address = :address',
                ExpressionAttributeValues={':address': query}
            )
            if not response['Items']:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Wallet not found'})
                }
            
            customer_id = response['Items'][0]['customer_id']
            customer_response = customers_table.get_item(Key={'customer_id': customer_id})
            response['Items'] = [customer_response['Item']]
        
        if not response['Items']:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Customer not found'})
            }
        
        customer = response['Items'][0]
        customer_id = customer['customer_id']
        
        # Get all wallets for this customer
        wallets_response = wallets_table.query(
            IndexName='customer_id-index',
            KeyConditionExpression='customer_id = :cid',
            ExpressionAttributeValues={':cid': customer_id}
        )
        
        wallets = wallets_response['Items']
        declared = [w for w in wallets if w.get('declared', False)]
        undeclared = [w for w in wallets if not w.get('declared', False)]
        
        # Determine customer profile and extract balances
        customer_profile = determine_customer_profile(customer_id, wallets)
        wallet_balances = extract_wallet_balances(wallets)
        
        print(f"Customer profile: {customer_profile}")
        print(f"Wallet balances: {wallet_balances}")
        
        # Enrich each wallet with Luno and Etherscan data
        enriched_wallets = []
        for wallet in wallets:
            luno_data = enrich_with_luno(wallet['wallet_address'], customer_profile, wallet_balances)
            etherscan_data = enrich_with_etherscan(wallet['wallet_address'])
            
            enriched_wallet = wallet.copy()
            enriched_wallet['luno_data'] = luno_data
            enriched_wallet['etherscan_data'] = etherscan_data
            enriched_wallet['combined_risk_score'] = calculate_combined_risk(wallet, luno_data, etherscan_data)
            
            enriched_wallets.append(enriched_wallet)
        
        # Recalculate declared/undeclared with enriched data
        declared = [w for w in enriched_wallets if w.get('declared', False)]
        undeclared = [w for w in enriched_wallets if not w.get('declared', False)]
        
        # Calculate portfolio risk score (with Luno + Etherscan enrichment)
        portfolio_risk = sum(w.get('combined_risk_score', 0) for w in enriched_wallets) / len(enriched_wallets) if enriched_wallets else 0
        
        # Get risk flags
        risk_flags = []
        for wallet in enriched_wallets:
            tx_response = transactions_table.query(
                IndexName='from_wallet_id-index',
                KeyConditionExpression='from_wallet_id = :wid',
                ExpressionAttributeValues={':wid': wallet['wallet_id']}
            )
            
            for tx in tx_response['Items']:
                risk_response = risk_registry_table.get_item(Key={'wallet_address': tx.get('to_wallet_id', '')})
                if 'Item' in risk_response:
                    risk_item = risk_response['Item']
                    risk_flags.append({
                        'type': risk_item.get('risk_type', 'unknown'),
                        'description': f"Transaction to {risk_item.get('risk_type', 'unknown')} address",
                        'severity': 'high' if risk_item.get('risk_score', 0) > 70 else 'medium'
                    })
            
            # Add Luno-based risk flags
            if wallet.get('luno_data'):
                if wallet['combined_risk_score'] > wallet.get('risk_score', 0):
                    risk_flags.append({
                        'type': 'high_exchange_volume',
                        'description': 'High trading volume on Luno detected',
                        'severity': 'medium'
                    })
            
            # Add Etherscan-based risk flags
            if wallet.get('etherscan_data'):
                etherscan_data = wallet['etherscan_data']
                risk_indicators = etherscan_data.get('risk_indicators', {})
                
                if risk_indicators.get('high_frequency_trading'):
                    risk_flags.append({
                        'type': 'high_frequency_on_chain',
                        'description': 'High frequency on-chain transactions detected',
                        'severity': 'high'
                    })
                
                if risk_indicators.get('large_transactions'):
                    risk_flags.append({
                        'type': 'large_transactions',
                        'description': f"Multiple large transactions detected ({etherscan_data.get('transaction_count', 0)} total)",
                        'severity': 'medium'
                    })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'customer_id': customer_id,
                'sa_id': customer.get('sa_id', ''),
                'name': f"{customer.get('first_name', '')} {customer.get('last_name', '')}",
                'declared_wallets': declared,
                'undeclared_wallets': undeclared,
                'portfolio_risk_score': int(portfolio_risk),
                'risk_flags': risk_flags,
                'enriched_at': datetime.now().isoformat(),
                'luno_integration': 'enabled',
                'etherscan_integration': 'enabled'
            }, cls=DecimalEncoder)
        }
    except Exception as e:
        print(f"Search error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }