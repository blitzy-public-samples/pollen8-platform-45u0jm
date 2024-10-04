# Pollen8 Platform - Staging Environment Configuration
# This file defines the staging environment-specific Terraform configuration for the Pollen8 platform,
# orchestrating the deployment of infrastructure components with staging-appropriate settings.

# Requirements addressed:
# - Staging Environment (Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT)
# - Resource Optimization (Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT)
# - Environment Isolation (Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.0"
    }
  }
  backend "s3" {
    bucket = "pollen8-terraform-state"
    key    = "staging/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "mongodbatlas" {
  public_key  = var.mongodb_atlas_public_key
  private_key = var.mongodb_atlas_private_key
}

locals {
  environment = "staging"
  common_tags = {
    Environment = local.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# VPC Module
module "vpc" {
  source               = "../../modules/vpc"
  environment          = local.environment
  project_name         = var.project_name
  vpc_cidr             = "10.1.0.0/16"  # Staging-specific CIDR
  availability_zones   = ["us-east-1a", "us-east-1b"]  # Using 2 AZs for cost optimization
  private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
  public_subnet_cidrs  = ["10.1.101.0/24", "10.1.102.0/24"]
  tags                 = local.common_tags
}

# ECS Module
module "ecs" {
  source             = "../../modules/ecs"
  environment        = local.environment
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  ecs_task_cpu       = 256  # Reduced CPU for staging
  ecs_task_memory    = 512  # Reduced memory for staging
  ecs_desired_count  = 1    # Single instance for staging
  ecr_repository_url = var.ecr_repository_url
  image_tag          = var.image_tag
  aws_region         = var.aws_region
  tags               = local.common_tags
}

# RDS (MongoDB Atlas) Module
module "rds" {
  source                 = "../../modules/rds"
  environment            = local.environment
  project_name           = var.project_name
  vpc_id                 = module.vpc.vpc_id
  vpc_cidr_block         = module.vpc.vpc_cidr_block
  private_subnet_ids     = module.vpc.private_subnet_ids
  mongodb_atlas_org_id   = var.mongodb_atlas_org_id
  mongodb_instance_size  = "M10"  # Smaller instance size for staging
  aws_region             = var.aws_region
  mongodb_username       = var.mongodb_username
  mongodb_password       = var.mongodb_password
  mongodb_database_name  = "${var.project_name}_${local.environment}"
  tags                   = local.common_tags
}

# ElastiCache Module
module "elasticache" {
  source                = "../../modules/elasticache"
  environment           = local.environment
  project_name          = var.project_name
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  app_security_group_id = module.ecs.ecs_security_group_id
  node_type             = "cache.t3.micro"  # Smaller instance type for staging
  num_cache_nodes       = 1  # Single node for staging
  sns_topic_arn         = var.sns_topic_arn
  tags                  = local.common_tags
}

# Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_names" {
  description = "The names of the ECS services"
  value       = module.ecs.service_names
}

output "mongodb_connection_string" {
  description = "MongoDB Atlas connection string"
  value       = module.rds.mongodb_connection_string
  sensitive   = true
}

output "redis_endpoint" {
  description = "The endpoint of the Redis cluster"
  value       = module.elasticache.redis_endpoint
}

output "redis_port" {
  description = "The port of the Redis cluster"
  value       = module.elasticache.redis_port
}