# ElastiCache Redis Module for Pollen8 Platform
# This module sets up an AWS ElastiCache Redis cluster for high-performance caching

# Define the AWS provider
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

# Security group for Redis cluster
resource "aws_security_group" "redis" {
  name_prefix = "${var.project_name}-${var.environment}-redis-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis"
    Environment = var.environment
    Project     = var.project_name
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Subnet group for Redis cluster
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-${var.environment}-redis"
  subnet_ids = var.private_subnet_ids

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Parameter group for Redis configuration
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis6.x"
  name   = "${var.project_name}-${var.environment}-redis"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Redis cluster configuration
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-${var.environment}"
  engine               = "redis"
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.redis.name

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }

  # Enable multi-AZ deployment for high availability
  az_mode = var.num_cache_nodes > 1 ? "cross-az" : "single-az"

  # Enable automatic failover for clusters with more than one node
  automatic_failover_enabled = var.num_cache_nodes > 1

  # Enable encryption at rest
  at_rest_encryption_enabled = true

  # Enable encryption in transit
  transit_encryption_enabled = true

  # Set maintenance window (adjust as needed)
  maintenance_window = "sun:05:00-sun:06:00"

  # Set snapshot window and retention (adjust as needed)
  snapshot_window          = "00:00-01:00"
  snapshot_retention_limit = 7

  # Apply changes immediately (be cautious in production)
  apply_immediately = true

  lifecycle {
    ignore_changes = [
      # Ignore changes to tags, as they may be updated outside of Terraform
      tags,
    ]
  }
}

# CloudWatch alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "cache_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "120"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors Redis CPU utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.redis.id
  }
}

resource "aws_cloudwatch_metric_alarm" "cache_memory" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Redis memory utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.redis.id
  }
}

# Outputs
output "redis_endpoint" {
  description = "The endpoint of the Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "The port of the Redis cluster"
  value       = aws_elasticache_cluster.redis.port
}

output "redis_security_group_id" {
  description = "The ID of the Redis security group"
  value       = aws_security_group.redis.id
}