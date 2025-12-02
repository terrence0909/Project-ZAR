# Read the file
with open('./lambda_functions/lambda_search.py', 'r') as f:
    content = f.read()

# Replace the problematic line with the fix
old_line = "                'body': json.dumps({'wallet_address': wallet_address})"
new_line = "                'wallet_address': wallet_address"

content = content.replace(old_line, new_line)

# Write back
with open('./lambda_functions/lambda_search.py', 'w') as f:
    f.write(content)

print("Fixed the Etherscan payload!")
