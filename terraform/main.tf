terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "project-zar"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# ============================================
# DynamoDB Tables
# ============================================

resource "aws_dynamodb_table" "customers" {
  name           = "${var.project_name}-customers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "customer_id"

  attribute {
    name = "customer_id"
    type = "S"
  }

  attribute {
    name = "sa_id"
    type = "S"
  }

  global_secondary_index {
    name            = "sa_id-index"
    hash_key        = "sa_id"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expire_at"
    enabled        = false
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-customers"
  }
}

resource "aws_dynamodb_table" "wallets" {
  name           = "${var.project_name}-wallets"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "wallet_id"

  attribute {
    name = "wallet_id"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  attribute {
    name = "wallet_address"
    type = "S"
  }

  global_secondary_index {
    name            = "customer_id-index"
    hash_key        = "customer_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "wallet_address-index"
    hash_key        = "wallet_address"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-wallets"
  }
}

resource "aws_dynamodb_table" "transactions" {
  name           = "${var.project_name}-transactions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "from_wallet_id"
    type = "S"
  }

  attribute {
    name = "to_wallet_id"
    type = "S"
  }

  global_secondary_index {
    name            = "from_wallet_id-index"
    hash_key        = "from_wallet_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "to_wallet_id-index"
    hash_key        = "to_wallet_id"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-transactions"
  }
}

resource "aws_dynamodb_table" "risk_registry" {
  name           = "${var.project_name}-risk-registry"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "wallet_address"

  attribute {
    name = "wallet_address"
    type = "S"
  }

  attribute {
    name = "risk_type"
    type = "S"
  }

  global_secondary_index {
    name            = "risk_type-index"
    hash_key        = "risk_type"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-risk-registry"
  }
}

resource "aws_dynamodb_table" "wallet_clusters" {
  name           = "${var.project_name}-wallet-clusters"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "customer_id"

  attribute {
    name = "customer_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-wallet-clusters"
  }
}

# ============================================
# S3 Buckets
# ============================================

resource "aws_s3_bucket" "reports" {
  bucket = "${var.project_name}-reports-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-reports"
  }
}

resource "aws_s3_bucket_versioning" "reports" {
  bucket = aws_s3_bucket.reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "data_import" {
  bucket = "${var.project_name}-data-import-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-data-import"
  }
}

resource "aws_s3_bucket_versioning" "data_import" {
  bucket = aws_s3_bucket.data_import.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ============================================
# IAM Roles & Policies
# ============================================

resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-lambda-role"
  }
}

# Lambda Basic Execution Role
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB Access Policy for Lambda
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.project_name}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.customers.arn,
          "${aws_dynamodb_table.customers.arn}/index/*",
          aws_dynamodb_table.wallets.arn,
          "${aws_dynamodb_table.wallets.arn}/index/*",
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/index/*",
          aws_dynamodb_table.risk_registry.arn,
          "${aws_dynamodb_table.risk_registry.arn}/index/*",
          aws_dynamodb_table.wallet_clusters.arn,
          "${aws_dynamodb_table.wallet_clusters.arn}/index/*"
        ]
      }
    ]
  })
}

# S3 Access Policy for Lambda
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.project_name}-lambda-s3-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.reports.arn}/*",
          "${aws_s3_bucket.data_import.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.reports.arn,
          aws_s3_bucket.data_import.arn
        ]
      }
    ]
  })
}

# ============================================
# Lambda Functions
# ============================================

resource "aws_lambda_function" "search" {
  filename      = "lambda_search.zip"
  function_name = "${var.project_name}-search"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory

  environment {
    variables = {
      CUSTOMERS_TABLE      = aws_dynamodb_table.customers.name
      WALLETS_TABLE        = aws_dynamodb_table.wallets.name
      TRANSACTIONS_TABLE   = aws_dynamodb_table.transactions.name
      RISK_REGISTRY_TABLE  = aws_dynamodb_table.risk_registry.name
      WALLET_CLUSTERS_TABLE = aws_dynamodb_table.wallet_clusters.name
      S3_BUCKET            = aws_s3_bucket.reports.id
    }
  }

  tags = {
    Name = "${var.project_name}-search"
  }

  depends_on = [
    aws_dynamodb_table.customers,
    aws_dynamodb_table.wallets,
    aws_dynamodb_table.transactions,
    aws_dynamodb_table.risk_registry,
    aws_dynamodb_table.wallet_clusters
  ]
}

resource "aws_lambda_function" "graph" {
  filename      = "lambda_graph.zip"
  function_name = "${var.project_name}-graph"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory

  environment {
    variables = {
      CUSTOMERS_TABLE      = aws_dynamodb_table.customers.name
      WALLETS_TABLE        = aws_dynamodb_table.wallets.name
      TRANSACTIONS_TABLE   = aws_dynamodb_table.transactions.name
      RISK_REGISTRY_TABLE  = aws_dynamodb_table.risk_registry.name
      WALLET_CLUSTERS_TABLE = aws_dynamodb_table.wallet_clusters.name
    }
  }

  tags = {
    Name = "${var.project_name}-graph"
  }

  depends_on = [
    aws_dynamodb_table.customers,
    aws_dynamodb_table.wallets,
    aws_dynamodb_table.transactions,
    aws_dynamodb_table.risk_registry,
    aws_dynamodb_table.wallet_clusters
  ]
}

resource "aws_lambda_function" "report" {
  filename      = "lambda_report.zip"
  function_name = "${var.project_name}-report"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60
  memory_size   = 512

  environment {
    variables = {
      CUSTOMERS_TABLE      = aws_dynamodb_table.customers.name
      WALLETS_TABLE        = aws_dynamodb_table.wallets.name
      TRANSACTIONS_TABLE   = aws_dynamodb_table.transactions.name
      RISK_REGISTRY_TABLE  = aws_dynamodb_table.risk_registry.name
      WALLET_CLUSTERS_TABLE = aws_dynamodb_table.wallet_clusters.name
      S3_BUCKET            = aws_s3_bucket.reports.id
    }
  }

  tags = {
    Name = "${var.project_name}-report"
  }

  depends_on = [
    aws_dynamodb_table.customers,
    aws_dynamodb_table.wallets,
    aws_dynamodb_table.transactions,
    aws_dynamodb_table.risk_registry,
    aws_dynamodb_table.wallet_clusters
  ]
}

# Luno Data Enrichment Lambda
resource "aws_lambda_function" "luno_enrichment" {
  filename      = "lambda_luno.zip"
  function_name = "${var.project_name}-luno-enrichment"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      LUNO_API_KEY_ID     = "b5kjun3atmg6x"
      LUNO_API_KEY_SECRET = "AOD-vjfy7FGAopWD88NorIr3tlTOZ-zMeX-QQN4wXRk"
      WALLETS_TABLE       = aws_dynamodb_table.wallets.name
    }
  }

  tags = {
    Name = "${var.project_name}-luno-enrichment"
  }

  depends_on = [
    aws_dynamodb_table.wallets
  ]
}

# Etherscan Enrichment Lambda
resource "aws_lambda_function" "etherscan_enrichment" {
  filename      = "lambda_etherscan.zip"
  function_name = "${var.project_name}-etherscan-enrichment"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      ETHERSCAN_API_KEY = var.etherscan_api_key
      WALLETS_TABLE     = aws_dynamodb_table.wallets.name
    }
  }

  depends_on = [
    aws_dynamodb_table.wallets
  ]

  tags = {
    Name = "${var.project_name}-etherscan-enrichment"
  }
}

# ============================================
# API Gateway
# ============================================

resource "aws_api_gateway_rest_api" "zar" {
  name        = "${var.project_name}-api"
  description = "Project ZAR Serverless API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${var.project_name}-api"
  }
}

# /search endpoint
resource "aws_api_gateway_resource" "search" {
  rest_api_id = aws_api_gateway_rest_api.zar.id
  parent_id   = aws_api_gateway_rest_api.zar.root_resource_id
  path_part   = "search"
}

resource "aws_api_gateway_method" "search_post" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.search.id
  http_method      = "POST"
  authorization    = "NONE"
}

resource "aws_api_gateway_method_response" "search_post_response" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.search.id
  http_method      = "POST"
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "search_lambda" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.search.id
  http_method      = aws_api_gateway_method.search_post.http_method
  type             = "AWS_PROXY"
  integration_http_method = "POST"
  uri              = aws_lambda_function.search.invoke_arn
}

resource "aws_api_gateway_integration_response" "search_post_integration" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.search.id
  http_method      = "POST"
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.search_lambda]
}

resource "aws_lambda_permission" "search_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.zar.execution_arn}/*/*"
}

# CORS for /search
resource "aws_api_gateway_method" "search_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.search.id
  http_method      = "OPTIONS"
  authorization    = "NONE"
}

resource "aws_api_gateway_integration" "search_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.search.id
  http_method      = aws_api_gateway_method.search_options.http_method
  type             = "MOCK"
}

resource "aws_api_gateway_integration_response" "search_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.search.id
  http_method      = aws_api_gateway_method.search_options.http_method
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.search_options]
}

resource "aws_api_gateway_method_response" "search_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.search.id
  http_method      = aws_api_gateway_method.search_options.http_method
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# /graph endpoint
resource "aws_api_gateway_resource" "graph" {
  rest_api_id = aws_api_gateway_rest_api.zar.id
  parent_id   = aws_api_gateway_rest_api.zar.root_resource_id
  path_part   = "graph"
}

resource "aws_api_gateway_method" "graph_post" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.graph.id
  http_method      = "POST"
  authorization    = "NONE"
}

resource "aws_api_gateway_method_response" "graph_post_response" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.graph.id
  http_method      = "POST"
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "graph_lambda" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.graph.id
  http_method      = aws_api_gateway_method.graph_post.http_method
  type             = "AWS_PROXY"
  integration_http_method = "POST"
  uri              = aws_lambda_function.graph.invoke_arn
}

resource "aws_api_gateway_integration_response" "graph_post_integration" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.graph.id
  http_method      = "POST"
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.graph_lambda]
}

resource "aws_lambda_permission" "graph_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.graph.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.zar.execution_arn}/*/*"
}

# CORS for /graph
resource "aws_api_gateway_method" "graph_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.graph.id
  http_method      = "OPTIONS"
  authorization    = "NONE"
}

resource "aws_api_gateway_integration" "graph_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.graph.id
  http_method      = aws_api_gateway_method.graph_options.http_method
  type             = "MOCK"
}

resource "aws_api_gateway_integration_response" "graph_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.graph.id
  http_method      = aws_api_gateway_method.graph_options.http_method
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.graph_options]
}

resource "aws_api_gateway_method_response" "graph_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.graph.id
  http_method      = aws_api_gateway_method.graph_options.http_method
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# /report endpoint
resource "aws_api_gateway_resource" "report" {
  rest_api_id = aws_api_gateway_rest_api.zar.id
  parent_id   = aws_api_gateway_rest_api.zar.root_resource_id
  path_part   = "report"
}

resource "aws_api_gateway_method" "report_post" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.report.id
  http_method      = "POST"
  authorization    = "NONE"
}

resource "aws_api_gateway_method_response" "report_post_response" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.report.id
  http_method      = "POST"
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "report_lambda" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.report.id
  http_method      = aws_api_gateway_method.report_post.http_method
  type             = "AWS_PROXY"
  integration_http_method = "POST"
  uri              = aws_lambda_function.report.invoke_arn
}

resource "aws_api_gateway_integration_response" "report_post_integration" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.report.id
  http_method      = "POST"
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.report_lambda]
}

resource "aws_lambda_permission" "report_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.report.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.zar.execution_arn}/*/*"
}

# CORS for /report
resource "aws_api_gateway_method" "report_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.report.id
  http_method      = "OPTIONS"
  authorization    = "NONE"
}

resource "aws_api_gateway_integration" "report_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.report.id
  http_method      = aws_api_gateway_method.report_options.http_method
  type             = "MOCK"
}

resource "aws_api_gateway_integration_response" "report_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.report.id
  http_method      = aws_api_gateway_method.report_options.http_method
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.report_options]
}

resource "aws_api_gateway_method_response" "report_options" {
  rest_api_id      = aws_api_gateway_rest_api.zar.id
  resource_id      = aws_api_gateway_resource.report.id
  http_method      = aws_api_gateway_method.report_options.http_method
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# API Deployment
resource "aws_api_gateway_deployment" "zar" {
  depends_on = [
    aws_api_gateway_integration.search_lambda,
    aws_api_gateway_integration.search_options,
    aws_api_gateway_integration.graph_lambda,
    aws_api_gateway_integration.graph_options,
    aws_api_gateway_integration.report_lambda,
    aws_api_gateway_integration.report_options
  ]

  rest_api_id = aws_api_gateway_rest_api.zar.id
  stage_name  = var.environment
}