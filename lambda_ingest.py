import os
import json
import boto3
import xml.etree.ElementTree as ET
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get table names from environment
customers_table = dynamodb.Table(os.environ['CUSTOMERS_TABLE'])
wallets_table = dynamodb.Table(os.environ['WALLETS_TABLE'])
transactions_table = dynamodb.Table(os.environ['TRANSACTIONS_TABLE'])

def lambda_handler(event, context):
    """
    S3 trigger: When XML is uploaded, parse and load into DynamoDB
    """
    try:
        # Get S3 bucket and key from event
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']
        
        print(f"Processing: s3://{bucket}/{key}")
        
        # Download XML from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        xml_content = response['Body'].read().decode('utf-8')
        
        # Parse XML
        root = ET.fromstring(xml_content)
        
        # Extract VASP info
        vasp_elem = root.find('.//VASP')
        vasp_id = vasp_elem.get('id') if vasp_elem is not None else 'unknown'
        
        loaded_count = 0
        
        # ============================================
        # Process Customers
        # ============================================
        for customer_elem in root.findall('.//Customer'):
            customer_id = customer_elem.findtext('CustomerID', f"cust_{uuid.uuid4().hex[:8]}")
            sa_id = customer_elem.findtext('SAIDNumber', '')
            first_name = customer_elem.findtext('FirstName', '')
            last_name = customer_elem.findtext('LastName', '')
            email = customer_elem.findtext('Email', '')
            
            if not sa_id:
                print(f"Skipping customer {customer_id}: No SA ID provided")
                continue
            
            try:
                customers_table.put_item(Item={
                    'customer_id': customer_id,
                    'sa_id': sa_id,
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                    'vasp_id': vasp_id,
                    'created_at': datetime.now().isoformat(),
                    'source': 'travel_rule_xml'
                })
                print(f"✓ Customer loaded: {sa_id}")
                loaded_count += 1
            except Exception as e:
                print(f"✗ Error loading customer {customer_id}: {e}")
        
        # ============================================
        # Process Wallets
        # ============================================
        for wallet_elem in root.findall('.//Wallet'):
            wallet_id = f"wallet_{uuid.uuid4().hex[:8]}"
            wallet_address = wallet_elem.findtext('Address', '')
            blockchain = wallet_elem.findtext('Blockchain', 'ethereum')
            customer_id = wallet_elem.findtext('CustomerID', '')
            declared = wallet_elem.findtext('Declared', 'true').lower() == 'true'
            
            if not wallet_address or not customer_id:
                print(f"Skipping wallet: Missing address or customer_id")
                continue
            
            try:
                wallets_table.put_item(Item={
                    'wallet_id': wallet_id,
                    'wallet_address': wallet_address,
                    'customer_id': customer_id,
                    'blockchain': blockchain,
                    'declared': declared,
                    'risk_score': 0,  # Will be calculated later
                    'balance': Decimal('0'),
                    'created_at': datetime.now().isoformat(),
                    'source': 'travel_rule_xml'
                })
                print(f"✓ Wallet loaded: {wallet_address[:16]}... (declared: {declared})")
                loaded_count += 1
            except Exception as e:
                print(f"✗ Error loading wallet {wallet_address}: {e}")
        
        # ============================================
        # Process Transactions
        # ============================================
        for tx_elem in root.findall('.//Transaction'):
            transaction_id = f"tx_{uuid.uuid4().hex[:8]}"
            tx_hash = tx_elem.findtext('Hash', '')
            from_address = tx_elem.findtext('FromAddress', '')
            to_address = tx_elem.findtext('ToAddress', '')
            amount_str = tx_elem.findtext('Amount', '0')
            currency = tx_elem.findtext('Currency', 'ETH')
            timestamp = tx_elem.findtext('Timestamp', datetime.now().isoformat())
            blockchain = tx_elem.findtext('Blockchain', 'ethereum')
            
            if not tx_hash or not from_address or not to_address:
                print(f"Skipping transaction: Missing required fields")
                continue
            
            try:
                amount = Decimal(amount_str)
                transactions_table.put_item(Item={
                    'transaction_id': transaction_id,
                    'from_wallet_id': from_address,
                    'to_wallet_id': to_address,
                    'amount': amount,
                    'currency': currency,
                    'transaction_hash': tx_hash,
                    'blockchain': blockchain,
                    'timestamp': timestamp,
                    'source': 'travel_rule_xml'
                })
                print(f"✓ Transaction loaded: {from_address[:8]}... → {to_address[:8]}... ({amount} {currency})")
                loaded_count += 1
            except Exception as e:
                print(f"✗ Error loading transaction {tx_hash}: {e}")
        
        # ============================================
        # Return Success
        # ============================================
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully loaded {loaded_count} records from {key}',
                'file': key,
                'records_loaded': loaded_count
            })
        }
    
    except Exception as e:
        print(f"Error processing XML: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


# For local testing
if __name__ == "__main__":
    import os
    os.environ['CUSTOMERS_TABLE'] = 'project-zar-customers'
    os.environ['WALLETS_TABLE'] = 'project-zar-wallets'
    os.environ['TRANSACTIONS_TABLE'] = 'project-zar-transactions'
    
    # Mock S3 event for testing
    test_event = {
        'Records': [{
            's3': {
                'bucket': {'name': 'project-zar-data-import-509399598950'},
                'object': {'key': 'travel_rule_sample.xml'}
            }
        }]
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))