import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

customers_table = dynamodb.Table(os.environ['CUSTOMERS_TABLE'])
wallets_table = dynamodb.Table(os.environ['WALLETS_TABLE'])

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        customer_id = body['customer_id']
        investigator_name = body.get('investigator_name', 'Unknown')
        
        # Get customer
        customer_response = customers_table.get_item(Key={'customer_id': customer_id})
        if 'Item' not in customer_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Customer not found'})
            }
        
        customer = customer_response['Item']
        
        # Get wallets
        wallets_response = wallets_table.query(
            IndexName='customer_id-index',
            KeyConditionExpression='customer_id = :cid',
            ExpressionAttributeValues={':cid': customer_id}
        )
        wallets = wallets_response['Items']
        
        # Generate report
        report_content = f"""
CRYPTO INTELLIGENCE REPORT
Generated: {datetime.now().isoformat()}
Investigator: {investigator_name}

CUSTOMER INFORMATION
Name: {customer.get('first_name', '')} {customer.get('last_name', '')}
SA ID: {customer.get('sa_id', '')}
Customer ID: {customer_id}

WALLET PORTFOLIO
Total Wallets Found: {len(wallets)}
Declared: {len([w for w in wallets if w.get('declared', False)])}
Undeclared: {len([w for w in wallets if not w.get('declared', False)])}

WALLETS:
"""
        for wallet in wallets:
            report_content += f"\n- {wallet['wallet_address']} ({wallet['blockchain']}) - Risk Score: {wallet.get('risk_score', 0)}"
        
        # Save to S3
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        s3_key = f"reports/{customer_id}_{timestamp}.txt"
        
        s3.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=s3_key,
            Body=report_content,
            ContentType='text/plain'
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'report_url': f"s3://{os.environ['S3_BUCKET']}/{s3_key}",
                'status': 'success'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
