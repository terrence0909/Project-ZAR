output "api_gateway_url" {
  description = "API Gateway base URL for frontend"
  value       = "${aws_api_gateway_deployment.zar.invoke_url}"
}

output "search_endpoint" {
  description = "Search API endpoint"
  value       = "${aws_api_gateway_deployment.zar.invoke_url}/search"
}

output "graph_endpoint" {
  description = "Graph API endpoint"
  value       = "${aws_api_gateway_deployment.zar.invoke_url}/graph"
}

output "report_endpoint" {
  description = "Report API endpoint"
  value       = "${aws_api_gateway_deployment.zar.invoke_url}/report"
}

output "search_lambda_arn" {
  description = "Search Lambda function ARN"
  value       = aws_lambda_function.search.arn
}

output "graph_lambda_arn" {
  description = "Graph Lambda function ARN"
  value       = aws_lambda_function.graph.arn
}

output "report_lambda_arn" {
  description = "Report Lambda function ARN"
  value       = aws_lambda_function.report.arn
}

output "s3_reports_bucket" {
  description = "S3 bucket for reports"
  value       = aws_s3_bucket.reports.id
}

output "s3_data_import_bucket" {
  description = "S3 bucket for data imports"
  value       = aws_s3_bucket.data_import.id
}

output "dynamodb_customers_table" {
  description = "DynamoDB customers table name"
  value       = aws_dynamodb_table.customers.name
}

output "dynamodb_wallets_table" {
  description = "DynamoDB wallets table name"
  value       = aws_dynamodb_table.wallets.name
}

output "dynamodb_transactions_table" {
  description = "DynamoDB transactions table name"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_risk_registry_table" {
  description = "DynamoDB risk registry table name"
  value       = aws_dynamodb_table.risk_registry.name
}

output "dynamodb_wallet_clusters_table" {
  description = "DynamoDB wallet clusters table name"
  value       = aws_dynamodb_table.wallet_clusters.name
}