import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')

wallets_table = dynamodb.Table(os.environ['WALLETS_TABLE'])
transactions_table = dynamodb.Table(os.environ['TRANSACTIONS_TABLE'])
risk_registry_table = dynamodb.Table(os.environ['RISK_REGISTRY_TABLE'])

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        wallet_address = body['wallet_address']
        
        # Find wallet
        response = wallets_table.query(
            IndexName='wallet_address-index',
            KeyConditionExpression='wallet_address = :address',
            ExpressionAttributeValues={':address': wallet_address}
        )
        
        if not response['Items']:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Wallet not found'})
            }
        
        wallet = response['Items'][0]
        wallet_id = wallet['wallet_id']
        
        # Get transactions from this wallet
        tx_response = transactions_table.query(
            IndexName='from_wallet_id-index',
            KeyConditionExpression='from_wallet_id = :wid',
            ExpressionAttributeValues={':wid': wallet_id}
        )
        
        transactions = tx_response['Items']
        
        # Build nodes and edges
        nodes = [{
            'id': wallet_address,
            'label': 'Primary Wallet',
            'risk_score': wallet.get('risk_score', 0),
            'balance': wallet.get('balance', 0)
        }]
        
        edges = []
        seen_nodes = {wallet_address}
        
        for tx in transactions:
            to_wallet = tx.get('to_wallet_id', '')
            if to_wallet and to_wallet not in seen_nodes:
                # Check if this is a risk entity
                risk_response = risk_registry_table.get_item(Key={'wallet_address': to_wallet})
                if 'Item' in risk_response:
                    risk_item = risk_response['Item']
                    nodes.append({
                        'id': to_wallet,
                        'label': risk_item.get('risk_type', 'unknown'),
                        'risk_score': risk_item.get('risk_score', 0),
                        'type': 'risk'
                    })
                else:
                    nodes.append({
                        'id': to_wallet,
                        'label': 'Connected Wallet',
                        'risk_score': 0
                    })
                seen_nodes.add(to_wallet)
            
            edges.append({
                'source': wallet_address,
                'target': to_wallet,
                'transactions': 1,
                'volume': tx.get('amount', 0)
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'nodes': nodes, 'edges': edges})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
