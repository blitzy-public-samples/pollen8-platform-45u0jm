# This file defines the output values that are exported from the AWS ElastiCache Redis module,
# allowing other Terraform modules to access important information about the created Redis resources.

# Output the endpoint URL of the Redis cluster
output "redis_endpoint" {
  description = "The endpoint URL of the Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

# Output the port number of the Redis cluster
output "redis_port" {
  description = "The port number of the Redis cluster"
  value       = aws_elasticache_cluster.redis.port
}

# Output the ID of the security group created for Redis
output "redis_security_group_id" {
  description = "The ID of the security group created for Redis"
  value       = aws_security_group.redis.id
}

# Output the connection string for Redis in the format redis://endpoint:port
output "redis_connection_string" {
  description = "The connection string for Redis in the format redis://endpoint:port"
  value       = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.port}"
}

# This module addresses the following requirements:
# - Resource Information Sharing: Enables other modules to access ElastiCache details
#   (Technical Specification/6. INFRASTRUCTURE)
# - Cross-Module Communication: Facilitates integration between different infrastructure components
#   (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)

# Notes:
# - All outputs are carefully selected to provide necessary information for other modules
# - The connection string output simplifies Redis client configuration in application code
# - Security group ID is exposed to allow other resources to reference it for access
# - Outputs follow Terraform naming conventions and include descriptive documentation
# - The values are derived from the actual created resources, ensuring accuracy