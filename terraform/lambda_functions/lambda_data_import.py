import json
import boto3
import xml.etree.ElementTree as ET
from datetime import datetime
import uuid

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

customers_table = dynamodb.Table('project-zar-customers')
wallets_table = dynamodb.Table('project-zar-wallets')
transactions_table = dynamodb.Table('project-zar-transactions')
wallet_clusters_table = dynamodb.Table('project-zar-wallet-clusters')

def lambda_handler(event, context):
    try:
        print("Data import event:", json.dumps(event))
        
        # Process S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            print(f"Processing file: s3://{bucket}/{key}")
            
            # Get the XML file from S3
            response = s3.get_object(Bucket=bucket, Key=key)
            xml_content = response['Body'].read().decode('utf-8')
            
            # Parse XML
            root = ET.fromstring(xml_content)
            
            # Process customers and wallets
            processed_count = process_xml_data(root)
            
            print(f"Successfully processed {processed_count} items from {key}")
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed XML file',
                'processed_count': processed_count
            })
        }
        
    except Exception as e:
        print(f"Error processing XML: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_xml_data(root):
    processed_count = 0
    
    # Process customers
    for customer_elem in root.findall('.//customer'):
        # Use the existing customer_id from XML, don't generate random ones
        customer_id = customer_elem.find('customer_id').text if customer_elem.find('customer_id') is not None else f"cust_{uuid.uuid4().hex[:8]}"
        
        customer_data = {
            'customer_id': customer_id,
            'sa_id': customer_elem.find('sa_id').text if customer_elem.find('sa_id') is not None else '',
            'first_name': customer_elem.find('first_name').text if customer_elem.find('first_name') is not None else '',
            'last_name': customer_elem.find('last_name').text if customer_elem.find('last_name') is not None else '',
            'email': customer_elem.find('email').text if customer_elem.find('email') is not None else '',
            'vasp_id': customer_elem.find('vasp_id').text if customer_elem.find('vasp_id') is not None else '',
            'created_at': datetime.now().isoformat()
        }
        
        # Remove empty values
        customer_data = {k: v for k, v in customer_data.items() if v}
        
        # Save to DynamoDB
        customers_table.put_item(Item=customer_data)
        processed_count += 1
        print(f"Added customer: {customer_data['customer_id']}")
    
    # Process wallets separately to ensure all customers exist first
    for wallet_elem in root.findall('.//wallet'):
        wallet_id = wallet_elem.find('wallet_id').text if wallet_elem.find('wallet_id') is not None else f"wallet_{uuid.uuid4().hex[:8]}"
        customer_id = wallet_elem.find('customer_id').text if wallet_elem.find('customer_id') is not None else ''
        
        if not customer_id:
            print(f"Skipping wallet {wallet_id} - no customer_id")
            continue
            
        wallet_data = {
            'wallet_id': wallet_id,
            'customer_id': customer_id,
            'wallet_address': wallet_elem.find('wallet_address').text if wallet_elem.find('wallet_address') is not None else '',
            'declared': wallet_elem.find('declared').text.lower() == 'true' if wallet_elem.find('declared') is not None else True,
            'risk_score': int(wallet_elem.find('risk_score').text) if wallet_elem.find('risk_score') is not None else 50,
            'created_at': datetime.now().isoformat()
        }
        
        # Remove empty values
        wallet_data = {k: v for k, v in wallet_data.items() if v}
        
        # Save to DynamoDB
        wallets_table.put_item(Item=wallet_data)
        processed_count += 1
        print(f"Added wallet: {wallet_data['wallet_address']} for customer {customer_id}")
    
    return processed_count