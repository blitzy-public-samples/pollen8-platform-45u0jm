# Pollen8 Platform - Production Environment Infrastructure
# This file defines the production-specific Terraform configuration for the Pollen8 platform,
# orchestrating the deployment of all infrastructure components in the production environment.

# Requirements addressed:
# - Production Infrastructure (Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT)
# - High Availability (Technical Specification/6. INFRASTRUCTURE/6.4 ORCHESTRATION)
# - Security (Technical Specification/5. SECURITY CONSIDERATIONS)
# - Scalability (Technical Specification/6. INFRASTRUCTURE/6.4.1 ECS Configuration)

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
    bucket         = "pollen8-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "pollen8-terraform-locks"
  }
}

# Provider configuration
provider "aws" {
  region = var.aws_region
}

provider "mongodbatlas" {
  public_key  = var.mongodb_atlas_public_key
  private_key = var.mongodb_atlas_private_key
}

# Local variables
locals {
  environment = "production"
}

# VPC Module
module "vpc" {
  source               = "../../modules/vpc"
  project_name         = var.project_name
  environment          = local.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
}

# ECS Module
module "ecs" {
  source             = "../../modules/ecs"
  project_name       = var.project_name
  environment        = local.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  ecr_repository_url = var.ecr_repository_url
  image_tag          = var.image_tag
  aws_region         = var.aws_region

  # ECS-specific variables
  ecs_task_cpu       = var.ecs_task_cpu
  ecs_task_memory    = var.ecs_task_memory
  ecs_desired_count  = var.ecs_desired_count
}

# RDS (MongoDB Atlas) Module
module "rds" {
  source                 = "../../modules/rds"
  project_name           = var.project_name
  environment            = local.environment
  vpc_id                 = module.vpc.vpc_id
  vpc_cidr_block         = var.vpc_cidr
  aws_region             = var.aws_region
  mongodb_atlas_org_id   = var.mongodb_atlas_org_id
  mongodb_instance_size  = var.mongodb_instance_size
  mongodb_username       = var.mongodb_username
  mongodb_password       = var.mongodb_password
  mongodb_database_name  = var.mongodb_database_name
}

# ElastiCache Module
module "elasticache" {
  source                = "../../modules/elasticache"
  project_name          = var.project_name
  environment           = local.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  app_security_group_id = module.ecs.ecs_security_group_id
  node_type             = var.redis_node_type
  num_cache_nodes       = var.redis_num_cache_nodes
  sns_topic_arn         = aws_sns_topic.alerts.arn
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_utilization" {
  alarm_name          = "${var.project_name}-${local.environment}-ecs-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = module.ecs.cluster_name
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_utilization" {
  alarm_name          = "${var.project_name}-${local.environment}-ecs-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = module.ecs.cluster_name
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${local.environment}-alerts"
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

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}