# Find the enrich_with_etherscan function and replace it with this:
def enrich_with_etherscan(wallet_address):
    """Call Etherscan enrichment Lambda to get on-chain data"""
    try:
        print(f"Enriching wallet {wallet_address} with Etherscan data...")
        response = lambda_client.invoke(
            FunctionName='project-zar-etherscan-enrichment',
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'wallet_address': wallet_address
            })
        )
        
        result = json.loads(response['Payload'].read().decode())
        
        # Handle both direct response and API Gateway wrapped response
        if 'body' in result:
            body = json.loads(result['body'])
            etherscan_data = body.get('etherscan_data')
        else:
            etherscan_data = result.get('etherscan_data')
        
        if etherscan_data:
            print(f"✓ Etherscan data retrieved: {etherscan_data.get('transaction_count', 0)} transactions")
        
        return etherscan_data
    except Exception as e:
        print(f"Etherscan enrichment error: {e}")
        return None
