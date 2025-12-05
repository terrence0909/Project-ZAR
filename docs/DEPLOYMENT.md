# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Environment variables set correctly
- [ ] API keys validated
- [ ] Dependencies up to date
- [ ] Code reviewed and approved

## Build for Production

```bash
# 1. Create production build
npm run build

# Output will be in dist/ directory (typically 200-400KB gzipped)

# 2. Test production build locally
npm run preview

# Visit http://localhost:4173
```

## AWS S3 + CloudFront Deployment

### 1. Setup AWS Resources

```bash
# Create S3 bucket
aws s3 mb s3://project-zar-prod --region us-east-1

# Block public access
aws s3api put-bucket-public-access-block \
  --bucket project-zar-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket project-zar-prod \
  --versioning-configuration Status=Enabled
```

### 2. Deploy Frontend

```bash
# Sync dist folder to S3
aws s3 sync dist/ s3://project-zar-prod \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://project-zar-prod/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"
```

### 3. CloudFront Configuration

```bash
# Create CloudFront distribution (use AWS Console for detailed setup)
# Distribution Settings:
# - Origin: S3 bucket
# - Default Root Object: index.html
# - Viewer Protocol Policy: Redirect HTTP to HTTPS
# - Compress Objects: Enable
# - Cache Behaviors: index.html (no cache), assets/* (1 year)
```

### 4. Invalidate Cache

```bash
# After deployment, invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123ABCDEF456 \
  --paths "/*"
```

## Lambda Function Deployment

```bash
# 1. Build Lambda function code
zip -r lambda-function.zip .

# 2. Update function code
aws lambda update-function-code \
  --function-name customers-api \
  --zip-file fileb://lambda-function.zip \
  --region us-east-1

# 3. Publish new version
aws lambda publish-version \
  --function-name customers-api \
  --region us-east-1
```

## DNS & Domain Configuration

### Route53 Setup

```bash
# Create alias record pointing to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "zar.yourcompany.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d123456.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

## SSL Certificate Setup

```bash
# Request SSL certificate via AWS Certificate Manager
# 1. Go to AWS Certificate Manager
# 2. Request certificate for:
#    - zar.yourcompany.com
#    - *.zar.yourcompany.com (wildcard)
# 3. Add to CloudFront distribution
```

## Environment Configuration

Create `.env.production`:
```env
VITE_APP_NAME=Project ZAR
VITE_COMPANY_NAME=Your Company
VITE_AWS_API_ENDPOINT=https://api-prod.yourcompany.com
VITE_AWS_REGION=us-east-1
VITE_ENABLE_ANALYTICS=true
```

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws s3 sync dist/ s3://project-zar-prod --delete
      
      - name: Invalidate CloudFront
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DIST_ID }} \
            --paths "/*"
```

## Rollback Procedure

```bash
# 1. Get previous S3 version
aws s3 ls s3://project-zar-prod --recursive --human-readable --summarize

# 2. Restore specific version
aws s3api get-object \
  --bucket project-zar-prod \
  --key index.html \
  --version-id 'VersionID' \
  index.html

# 3. Invalidate CloudFront again
aws cloudfront create-invalidation \
  --distribution-id E123ABCDEF456 \
  --paths "/*"
```

## Performance Monitoring

```bash
# Measure page load times
curl -w "Time: %{time_total}s\n" https://zar.yourcompany.com

# Test from different regions
docker run -it sitespeed/sitespeed.io https://zar.yourcompany.com
```

## Deployment Troubleshooting

### Build fails with memory error
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### CloudFront not updating
```bash
# Ensure invalidation is complete
aws cloudfront get-invalidation \
  --distribution-id E123ABCDEF456 \
  --id I123ABC
```

### S3 access denied
```bash
# Verify IAM permissions
aws sts get-caller-identity

# Check S3 bucket policy
aws s3api get-bucket-policy --bucket project-zar-prod
```