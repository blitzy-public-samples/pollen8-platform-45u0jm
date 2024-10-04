# This file defines the output values for the Pollen8 platform's Terraform infrastructure configuration,
# making important resource information available for reference and use by other parts of the infrastructure.

# VPC Outputs
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

# ECS Outputs
output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = module.ecs.service_name
}

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

# Database Outputs
output "mongodb_connection_string" {
  description = "The connection string for MongoDB Atlas"
  value       = module.rds.mongodb_connection_string
  sensitive   = true
}

output "mongodb_cluster_name" {
  description = "The name of the MongoDB Atlas cluster"
  value       = module.rds.cluster_name
}

# ElastiCache Outputs
output "redis_endpoint" {
  description = "The endpoint URL for the ElastiCache Redis cluster"
  value       = module.elasticache.redis_endpoint
}

output "redis_port" {
  description = "The port number for the ElastiCache Redis cluster"
  value       = module.elasticache.redis_port
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}