# This file defines production-specific variables for the Pollen8 platform's infrastructure,
# ensuring robust and scalable deployment in the production environment.

# Requirements addressed:
# - Production Environment Configuration (Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT)
# - High Availability (Technical Specification/6. INFRASTRUCTURE/6.4.1 ECS Configuration)
# - Resource Optimization (Technical Specification/6. INFRASTRUCTURE)

# Core variables
variable "environment" {
  type        = string
  description = "The deployment environment"
  default     = "production"
}

variable "project_name" {
  type        = string
  description = "The name of the project for resource tagging"
  default     = "pollen8-prod"
}

variable "aws_region" {
  type        = string
  description = "The AWS region for production deployment"
  default     = "us-east-1"
}

# ECS Configuration
variable "ecs_task_cpu" {
  type        = number
  description = "The amount of CPU to allocate for each ECS task in production"
  default     = 1024
}

variable "ecs_task_memory" {
  type        = number
  description = "The amount of memory to allocate for each ECS task in production"
  default     = 2048
}

variable "ecs_desired_count" {
  type        = number
  description = "The desired number of ECS tasks to run in production"
  default     = 2
}

variable "ecs_max_capacity" {
  type        = number
  description = "The maximum number of ECS tasks for auto scaling in production"
  default     = 10
}

# Database Configuration
variable "mongodb_instance_size" {
  type        = string
  description = "The instance size for MongoDB Atlas cluster in production"
  default     = "M30"
}

variable "mongodb_database_name" {
  type        = string
  description = "The name of the MongoDB database in production"
  default     = "pollen8_production"
}

# ElastiCache Configuration
variable "elasticache_node_type" {
  type        = string
  description = "The node type for ElastiCache Redis in production"
  default     = "cache.t3.medium"
}

variable "elasticache_num_cache_nodes" {
  type        = number
  description = "The number of cache nodes in production"
  default     = 2
}

# VPC Configuration
variable "vpc_cidr" {
  type        = string
  description = "The CIDR block for the production VPC"
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "List of CIDR blocks for private subnets in production"
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "List of CIDR blocks for public subnets in production"
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# Additional production-specific variables

variable "domain_name" {
  type        = string
  description = "The domain name for the production Pollen8 application"
  default     = "pollen8.com"
}

variable "enable_waf" {
  type        = bool
  description = "Enable AWS WAF for production environment"
  default     = true
}

variable "enable_enhanced_monitoring" {
  type        = bool
  description = "Enable enhanced monitoring for production RDS instances"
  default     = true
}

variable "alarm_cpu_threshold" {
  type        = number
  description = "CPU utilization threshold for production CloudWatch alarms"
  default     = 70
}

variable "alarm_memory_threshold" {
  type        = number
  description = "Memory utilization threshold for production CloudWatch alarms"
  default     = 70
}

variable "log_retention_in_days" {
  type        = number
  description = "Number of days to retain CloudWatch logs in production"
  default     = 90
}

variable "backup_retention_period" {
  type        = number
  description = "Number of days to retain backups in production"
  default     = 30
}

variable "ssl_certificate_arn" {
  type        = string
  description = "The ARN of the SSL certificate for HTTPS in production"
}

variable "cloudfront_price_class" {
  type        = string
  description = "The price class for CloudFront distribution in production"
  default     = "PriceClass_All"
}

variable "s3_bucket_name" {
  type        = string
  description = "The name of the S3 bucket for static assets in production"
  default     = "pollen8-prod-assets"
}

# These production-specific variables override and extend the root variables,
# providing a robust configuration for the Pollen8 platform's production environment.
# They ensure high availability, optimal resource allocation, and enhanced security measures.