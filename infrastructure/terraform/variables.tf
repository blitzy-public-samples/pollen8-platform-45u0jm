# This file defines all the input variables required for the Pollen8 platform's Terraform infrastructure configuration,
# enabling flexible and environment-specific deployments.

# AWS Configuration
variable "aws_region" {
  type        = string
  description = "The AWS region to deploy resources in"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "The deployment environment (staging or production)"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_name" {
  type        = string
  description = "The name of the project for resource tagging"
  default     = "pollen8"
}

# VPC Configuration
variable "vpc_cidr" {
  type        = string
  description = "The CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones to use for resources"
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# ECS Configuration
variable "ecs_task_cpu" {
  type        = number
  description = "The amount of CPU to allocate for the ECS task"
  default     = 256
}

variable "ecs_task_memory" {
  type        = number
  description = "The amount of memory to allocate for the ECS task"
  default     = 512
}

variable "ecs_desired_count" {
  type        = number
  description = "The desired number of ECS tasks to run"
  default     = 2
}

# Database Configuration
variable "mongodb_atlas_public_key" {
  type        = string
  description = "The public key for MongoDB Atlas authentication"
}

variable "mongodb_atlas_private_key" {
  type        = string
  description = "The private key for MongoDB Atlas authentication"
}

variable "mongodb_instance_size" {
  type        = string
  description = "The instance size for MongoDB Atlas cluster"
  default     = "M10"
}

# ElastiCache Configuration
variable "elasticache_node_type" {
  type        = string
  description = "The node type for ElastiCache Redis"
  default     = "cache.t3.micro"
}

variable "elasticache_num_cache_nodes" {
  type        = number
  description = "The number of cache nodes for ElastiCache Redis"
  default     = 1
}

# Additional variables for comprehensive infrastructure setup

variable "api_container_port" {
  type        = number
  description = "The port on which the API container listens"
  default     = 3000
}

variable "frontend_container_port" {
  type        = number
  description = "The port on which the frontend container listens"
  default     = 80
}

variable "socket_container_port" {
  type        = number
  description = "The port on which the socket container listens"
  default     = 3001
}

variable "health_check_path" {
  type        = string
  description = "The path for the health check endpoint"
  default     = "/health"
}

variable "ssl_certificate_arn" {
  type        = string
  description = "The ARN of the SSL certificate for HTTPS"
}

variable "domain_name" {
  type        = string
  description = "The domain name for the Pollen8 application"
}

variable "route53_zone_id" {
  type        = string
  description = "The Route53 hosted zone ID for the domain"
}

variable "cloudfront_price_class" {
  type        = string
  description = "The price class for CloudFront distribution"
  default     = "PriceClass_100"
}

variable "s3_bucket_name" {
  type        = string
  description = "The name of the S3 bucket for static assets"
}

variable "log_retention_in_days" {
  type        = number
  description = "The number of days to retain CloudWatch logs"
  default     = 30
}

variable "enable_vpc_endpoints" {
  type        = bool
  description = "Whether to enable VPC endpoints for AWS services"
  default     = true
}

variable "enable_nat_gateway" {
  type        = bool
  description = "Whether to enable NAT Gateway for private subnets"
  default     = true
}

variable "enable_vpn_gateway" {
  type        = bool
  description = "Whether to enable a VPN Gateway"
  default     = false
}

variable "enable_flow_log" {
  type        = bool
  description = "Whether to enable VPC Flow Logs"
  default     = true
}

variable "flow_log_retention_in_days" {
  type        = number
  description = "Number of days to retain VPC Flow Logs"
  default     = 14
}

# Tags
variable "tags" {
  type        = map(string)
  description = "A map of tags to add to all resources"
  default     = {}
}

# Monitoring and Alerting
variable "enable_enhanced_monitoring" {
  type        = bool
  description = "Whether to enable enhanced monitoring for RDS instances"
  default     = true
}

variable "alarm_cpu_threshold" {
  type        = number
  description = "CPU utilization threshold for CloudWatch alarms"
  default     = 80
}

variable "alarm_memory_threshold" {
  type        = number
  description = "Memory utilization threshold for CloudWatch alarms"
  default     = 80
}

# Scaling
variable "enable_autoscaling" {
  type        = bool
  description = "Whether to enable auto scaling for ECS services"
  default     = true
}

variable "max_capacity" {
  type        = number
  description = "Maximum number of tasks when auto scaling"
  default     = 10
}

variable "min_capacity" {
  type        = number
  description = "Minimum number of tasks when auto scaling"
  default     = 2
}

# Security
variable "allowed_cidr_blocks" {
  type        = list(string)
  description = "List of CIDR blocks allowed to access the resources"
  default     = ["0.0.0.0/0"]
}

variable "enable_waf" {
  type        = bool
  description = "Whether to enable AWS WAF for the Application Load Balancer"
  default     = true
}

# Backup
variable "enable_backups" {
  type        = bool
  description = "Whether to enable automated backups for databases"
  default     = true
}

variable "backup_retention_period" {
  type        = number
  description = "Number of days to retain backups"
  default     = 7
}

# These variables provide a comprehensive set of configuration options for the Pollen8 infrastructure,
# addressing requirements for cloud infrastructure configuration, environment management, and resource tagging.
# They allow for flexible deployment across staging and production environments while maintaining
# consistent naming and tagging across resources.