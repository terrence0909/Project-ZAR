#!/usr/bin/env python3
"""
Project ZAR - XML Upload Handler
Accepts XML files from frontend and uploads to S3
"""

import json
import boto3
import base64
import uuid
from datetime import datetime
import os

s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Handles XML file uploads from frontend
    Receives base64 encoded file, saves to S3
    """
    try:
        # Parse request body
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        
        file_content_base64 = body.get('file')
        file_name = body.get('filename', f'upload_{uuid.uuid4().hex[:8]}.xml')
        
        if not file_content_base64:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No file content provided'})
            }
        
        # Decode base64 file
        try:
            file_content = base64.b64decode(file_content_base64)
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Invalid base64 encoding: {str(e)}'})
            }
        
        # Validate XML file extension
        if not file_name.lower().endswith('.xml'):
            file_name = f"{file_name}.xml"
        
        # Generate S3 key with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        s3_key = f"uploads/{timestamp}_{file_name}"
        
        # Upload to S3
        s3_bucket = os.environ['DATA_IMPORT_BUCKET']
        
        s3.put_object(
            Bucket=s3_bucket,
            Key=s3_key,
            Body=file_content,
            ContentType='application/xml'
        )
        
        print(f"✓ File uploaded: s3://{s3_bucket}/{s3_key}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'success',
                'message': f'XML file uploaded successfully',
                'filename': file_name,
                's3_location': f"s3://{s3_bucket}/{s3_key}",
                'timestamp': datetime.now().isoformat()
            })
        }
    
    except Exception as e:
        print(f"Error uploading file: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


if __name__ == "__main__":
    # Local test
    os.environ['DATA_IMPORT_BUCKET'] = 'project-zar-data-import-509399598950'
    
    # Sample base64 encoded XML
    sample_xml = b'<?xml version="1.0"?><TravelRuleReport><ReportDate>2025-11-29</ReportDate></TravelRuleReport>'
    sample_base64 = base64.b64encode(sample_xml).decode('utf-8')
    
    test_event = {
        'body': json.dumps({
            'file': sample_base64,
            'filename': 'test_upload.xml'
        })
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(json.loads(result['body']), indent=2))