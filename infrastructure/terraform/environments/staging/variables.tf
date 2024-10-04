# This file defines environment-specific variables for the staging deployment of the Pollen8 platform,
# inheriting and overriding values from the root variables file.

# Core variables
variable "environment" {
  type        = string
  description = "The deployment environment"
  default     = "staging"
}

variable "project_name" {
  type        = string
  description = "The name of the project for resource tagging"
  default     = "pollen8-staging"
}

variable "aws_region" {
  type        = string
  description = "The AWS region for staging deployment"
  default     = "us-east-1"
}

# ECS variables
variable "ecs_task_cpu" {
  type        = number
  description = "The amount of CPU to allocate for each ECS task in staging"
  default     = 256
}

variable "ecs_task_memory" {
  type        = number
  description = "The amount of memory to allocate for each ECS task in staging"
  default     = 512
}

variable "ecs_desired_count" {
  type        = number
  description = "The desired number of ECS tasks to run in staging"
  default     = 1
}

variable "ecs_max_capacity" {
  type        = number
  description = "The maximum number of ECS tasks for auto scaling in staging"
  default     = 2
}

# Database variables
variable "mongodb_instance_size" {
  type        = string
  description = "The instance size for MongoDB Atlas cluster in staging"
  default     = "M10"
}

variable "mongodb_database_name" {
  type        = string
  description = "The name of the MongoDB database in staging"
  default     = "pollen8_staging"
}

# ElastiCache variables
variable "elasticache_node_type" {
  type        = string
  description = "The node type for ElastiCache Redis in staging"
  default     = "cache.t3.micro"
}

variable "elasticache_num_cache_nodes" {
  type        = number
  description = "The number of cache nodes in staging"
  default     = 1
}

# VPC variables
variable "vpc_cidr" {
  type        = string
  description = "The CIDR block for the staging VPC"
  default     = "10.1.0.0/16"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "List of CIDR blocks for private subnets in staging"
  default     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "List of CIDR blocks for public subnets in staging"
  default     = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]
}

# The following comment block addresses the requirements and location in the technical specification
# for each group of variables defined above.

# Requirements addressed:
# 1. Staging Environment Configuration
#    Location: Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT
#    Description: Defines staging-specific infrastructure parameters
#
# 2. Resource Optimization
#    Location: Technical Specification/6. INFRASTRUCTURE/6.4.1 ECS Configuration
#    Description: Configures appropriate resource sizes for staging
#
# 3. Cost Management
#    Location: Technical Specification/6. INFRASTRUCTURE
#    Description: Ensures cost-effective resource allocation for non-production environment

# Note: This file inherits and overrides values from the root variables file (../../variables.tf).
# It provides staging-specific configurations for ECS, RDS, ElastiCache, and VPC modules.