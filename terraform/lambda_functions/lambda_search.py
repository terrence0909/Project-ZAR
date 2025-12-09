import json
import os
import boto3
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
customers_table = dynamodb.Table(os.environ['CUSTOMERS_TABLE'])
wallets_table = dynamodb.Table(os.environ['WALLETS_TABLE'])
transactions_table = dynamodb.Table(os.environ['TRANSACTIONS_TABLE'])
risk_registry_table = dynamodb.Table(os.environ['RISK_REGISTRY_TABLE'])
wallet_clusters_table = dynamodb.Table(os.environ['WALLET_CLUSTERS_TABLE'])

# CORS Headers
CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}

def lambda_handler(event, context):
    try:
        print("Raw event received:", json.dumps(event))
        
        # Handle CORS preflight requests
        if event.get('httpMethod') == 'OPTIONS':
            print("Handling CORS preflight request.")
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': ''
            }
        
        # Parse request
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        query = body.get('query', '')
        wallet_address = body.get('wallet_address', '')
        
        print(f"Search query: '{query}', Wallet address: '{wallet_address}'")
        
        # FIXED: Handle all cases
        if wallet_address:
            # Wallet lookup
            response = wallets_table.query(
                IndexName='wallet_address-index',
                KeyConditionExpression='wallet_address = :w',
                ExpressionAttributeValues={':w': wallet_address}
            )
            
            if not response['Items']:
                return {
                    'statusCode': 404,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Wallet not found'})
                }
            
            wallet = response['Items'][0]
            customer_id = wallet['customer_id']
            
            # Get customer
            response = customers_table.get_item(Key={'customer_id': customer_id})
            customer = response.get('Item', {})
            
            # Return single customer
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'success': True,
                    'customers': [customer] if customer else [],
                    'count': 1 if customer else 0
                })
            }
        
        elif query and query not in ['', 'all', 'list']:
            # Search by query
            response = customers_table.scan(
                FilterExpression='contains(#name, :q) OR contains(email, :q) OR contains(sa_id, :q)',
                ExpressionAttributeNames={'#name': 'name'},
                ExpressionAttributeValues={':q': query}
            )
            customers = response.get('Items', [])
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = customers_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                customers.extend(response.get('Items', []))
            
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'success': True,
                    'customers': customers,
                    'count': len(customers)
                })
            }
        
        else:
            # Return ALL customers
            response = customers_table.scan()
            customers = response.get('Items', [])
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = customers_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                customers.extend(response.get('Items', []))
            
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'success': True,
                    'customers': customers,
                    'count': len(customers)
                })
            }
            
    except Exception as e:
        print(f"Search error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
