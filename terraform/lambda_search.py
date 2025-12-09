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
        
        # Handle both direct invocation and API Gateway invocation
        if 'body' in event:
            # API Gateway invocation - body is stringified JSON
            body = json.loads(event['body']) if event['body'] else {}
            query = body.get('query', '')
            wallet_address = body.get('wallet_address', '')
        else:
            # Direct Lambda invocation
            query = event.get('query', '')
            wallet_address = event.get('wallet_address', '')
        
        print(f"Search query: '{query}', Wallet address: '{wallet_address}'")
        
        # FIXED: Remove strict validation - allow empty queries
        if wallet_address:
            # Search by wallet address
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
            
            # Get customer details
            response = customers_table.get_item(Key={'customer_id': customer_id})
            customer = response.get('Item', {})
        
        elif query:
            # Search customers by name, email, or SA ID
            response = customers_table.scan(
                FilterExpression='contains(#name, :q) OR contains(email, :q) OR contains(sa_id, :q)',
                ExpressionAttributeNames={'#name': 'name'},
                ExpressionAttributeValues={':q': query}
            )
            customers = response.get('Items', [])
            
            if not customers:
                return {
                    'statusCode': 404,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Customer not found'})
                }
            
            # Get first customer (or handle multiple results)
            customer = customers[0] if customers else {}
            customer_id = customer.get('customer_id', '')
        
        else:
            # FIXED: If no query or wallet_address, return ALL customers
            # This is what your dashboard expects
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
        
        # ... rest of your existing code for single customer lookup ...
        # (I'll truncate here since it's long, but keep your existing logic)
        
        # Your existing customer processing logic here
        # ...
        
    except Exception as e:
        print(f"Search error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
