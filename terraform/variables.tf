variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "project-zar"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Lambda function memory allocation in MB"
  type        = number
  default     = 256
}

variable "etherscan_api_key" {
  description = "Etherscan API key"
  type        = string
  sensitive   = true
}

variable "valr_api_key" {
  description = "VALR API Key"
  type        = string
  sensitive   = true
}

variable "valr_api_secret" {
  description = "VALR API Secret"
  type        = string
  sensitive   = true
}

variable "valr_proxy_url" {
  description = "Optional proxy URL for VALR API"
  type        = string
  default     = "https://api.valr.com"
}