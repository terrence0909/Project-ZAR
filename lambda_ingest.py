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
risk_registry_table = dynamodb.Table(os.environ['RISK_REGISTRY_TABLE'])

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
        
        # Extract metadata
        metadata = root.find('metadata')
        source = metadata.findtext('source', 'UNKNOWN') if metadata else 'UNKNOWN'
        
        loaded_count = 0
        
        # ============================================
        # Process Customers (NEW STRUCTURE)
        # ============================================
        for customer_elem in root.findall('.//customer'):
            customer_id = customer_elem.findtext('customer_id', f"cust_{uuid.uuid4().hex[:8]}")
            sa_id = customer_elem.findtext('sa_id', '')
            first_name = customer_elem.findtext('first_name', '')
            last_name = customer_elem.findtext('last_name', '')
            email = customer_elem.findtext('email', '')
            vasp_id = customer_elem.findtext('vasp_id', 'FNB_DIGITAL_ASSETS')
            created_at = customer_elem.findtext('created_at', datetime.now().isoformat())
            risk_score = Decimal(customer_elem.findtext('risk_score', '0'))
            pep_status = customer_elem.findtext('pep_status', 'false').lower() == 'true'
            kyc_status = customer_elem.findtext('kyc_status', 'UNKNOWN')
            
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
                    'created_at': created_at,
                    'risk_score': risk_score,
                    'pep_status': pep_status,
                    'kyc_status': kyc_status,
                    'source': source,
                    'xml_import_timestamp': datetime.now().isoformat()
                })
                print(f"✓ Customer loaded: {first_name} {last_name} ({sa_id}) - Risk: {risk_score}")
                loaded_count += 1
                
                # Also store in risk registry
                risk_registry_table.put_item(Item={
                    'customer_id': customer_id,
                    'overall_risk_score': risk_score,
                    'risk_category': customer_elem.findtext('fic_risk_category', 'MEDIUM'),
                    'pep_flag': pep_status,
                    'last_updated': datetime.now().isoformat(),
                    'source': 'xml_import'
                })
                
            except Exception as e:
                print(f"✗ Error loading customer {customer_id}: {e}")
        
        # ============================================
        # Process Wallets (NEW STRUCTURE)
        # ============================================
        for wallet_elem in root.findall('.//wallet'):
            wallet_id = wallet_elem.findtext('wallet_id', f"wallet_{uuid.uuid4().hex[:8]}")
            wallet_address = wallet_elem.findtext('wallet_address', '')
            blockchain = wallet_elem.findtext('blockchain', 'ethereum')
            customer_id = wallet_elem.findtext('customer_id', '')
            declared = wallet_elem.findtext('declared', 'true').lower() == 'true'
            balance = Decimal(wallet_elem.findtext('balance', '0'))
            risk_score = Decimal(wallet_elem.findtext('risk_score', '0'))
            currency = wallet_elem.findtext('currency', 'ETH')
            zar_value = Decimal(wallet_elem.findtext('zar_value', '0'))
            flags = wallet_elem.findtext('flags', '')
            last_activity = wallet_elem.findtext('last_activity', datetime.now().isoformat())
            
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
                    'risk_score': risk_score,
                    'balance': balance,
                    'currency': currency,
                    'zar_value': zar_value,
                    'flags': flags,
                    'last_activity': last_activity,
                    'created_at': wallet_elem.findtext('created_at', datetime.now().isoformat()),
                    'source': wallet_elem.findtext('source', 'xml_import')
                })
                print(f"✓ Wallet loaded: {wallet_address[:16]}... - Balance: {balance} {currency}, Risk: {risk_score}")
                loaded_count += 1
            except Exception as e:
                print(f"✗ Error loading wallet {wallet_address}: {e}")
        
        # ============================================
        # Process Exchange Accounts (NEW - for VALR data)
        # ============================================
        for exchange_elem in root.findall('.//exchange_account'):
            exchange_id = f"exchange_{uuid.uuid4().hex[:8]}"
            customer_id = exchange_elem.findtext('customer_id', '')
            exchange_name = exchange_elem.findtext('exchange_name', '')
            
            if not customer_id or not exchange_name:
                print(f"Skipping exchange account: Missing customer_id or exchange_name")
                continue
            
            try:
                # Store exchange account info
                exchange_data = {
                    'exchange_id': exchange_id,
                    'customer_id': customer_id,
                    'exchange_name': exchange_name,
                    'exchange_user_id': exchange_elem.findtext('exchange_user_id', ''),
                    'account_created': exchange_elem.findtext('account_created', datetime.now().isoformat()),
                    'kyc_status': exchange_elem.findtext('kyc_status', 'UNKNOWN'),
                    'trading_tier': exchange_elem.findtext('trading_tier', 'STANDARD'),
                    'pep_flag': exchange_elem.findtext('pep_flag', 'false').lower() == 'true',
                    'last_sync': exchange_elem.findtext('last_sync', datetime.now().isoformat()),
                    'source': source,
                    'import_timestamp': datetime.now().isoformat()
                }
                
                # Store balances separately
                balances = []
                for balance_elem in exchange_elem.findall('.//balance'):
                    balance_data = {
                        'currency': balance_elem.findtext('currency', ''),
                        'available': Decimal(balance_elem.findtext('available', '0')),
                        'reserved': Decimal(balance_elem.findtext('reserved', '0')),
                        'total': Decimal(balance_elem.findtext('total', '0'))
                    }
                    balances.append(balance_data)
                
                exchange_data['balances'] = balances
                
                # Store in DynamoDB (you might want a separate table for exchanges)
                customers_table.update_item(
                    Key={'customer_id': customer_id},
                    UpdateExpression='SET exchange_accounts = :exchange',
                    ExpressionAttributeValues={':exchange': exchange_data}
                )
                
                print(f"✓ Exchange account loaded: {exchange_name} for customer {customer_id}")
                loaded_count += 1
                
            except Exception as e:
                print(f"✗ Error loading exchange account: {e}")
        
        # ============================================
        # Process Transactions (if present in new XML)
        # ============================================
        for tx_elem in root.findall('.//transaction'):
            transaction_id = tx_elem.findtext('transaction_id', f"tx_{uuid.uuid4().hex[:8]}")
            customer_id = tx_elem.findtext('customer_id', '')
            exchange = tx_elem.findtext('exchange', '')
            tx_type = tx_elem.findtext('type', '')
            pair = tx_elem.findtext('pair', '')
            amount = Decimal(tx_elem.findtext('amount', '0'))
            total_amount_zar = Decimal(tx_elem.findtext('total_amount_zar', '0'))
            timestamp = tx_elem.findtext('timestamp', datetime.now().isoformat())
            
            if not transaction_id or not customer_id:
                continue
            
            try:
                transactions_table.put_item(Item={
                    'transaction_id': transaction_id,
                    'customer_id': customer_id,
                    'exchange': exchange,
                    'type': tx_type,
                    'pair': pair,
                    'amount': amount,
                    'total_amount_zar': total_amount_zar,
                    'timestamp': timestamp,
                    'status': tx_elem.findtext('status', 'COMPLETED'),
                    'source': 'xml_import'
                })
                print(f"✓ Transaction loaded: {tx_type} {amount} {pair} for {customer_id}")
                loaded_count += 1
            except Exception as e:
                print(f"✗ Error loading transaction: {e}")
        
        # ============================================
        # Return Success
        # ============================================
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully loaded {loaded_count} records from {key}',
                'file': key,
                'records_loaded': loaded_count,
                'source': source,
                'timestamp': datetime.now().isoformat()
            })
        }
    
    except Exception as e:
        print(f"Error processing XML: {e}")
        import traceback
        traceback.print_exc()
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
    os.environ['RISK_REGISTRY_TABLE'] = 'project-zar-risk-registry'
    
    # Mock S3 event for testing
    test_event = {
        'Records': [{
            's3': {
                'bucket': {'name': 'project-zar-data-import-509399598950'},
                'object': {'key': 'travel_rule_data.xml'}
            }
        }]
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))