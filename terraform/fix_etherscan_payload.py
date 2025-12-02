with open('./lambda_functions/lambda_search.py', 'r') as f:
    content = f.read()

# Replace the Etherscan payload
old_payload = '''            Payload=json.dumps({
                'wallet_address': wallet_address
            })'''
            
new_payload = '''            Payload=json.dumps({
                'body': json.dumps({'wallet_address': wallet_address})
            })'''

content = content.replace(old_payload, new_payload)

with open('./lambda_functions/lambda_search.py', 'w') as f:
    f.write(content)

print("Fixed Etherscan payload!")
