# This file defines the input variables required for configuring the AWS ElastiCache Redis infrastructure module for the Pollen8 platform.

# Requirement addressed: Environment Isolation
# Location: Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT
variable "environment" {
  description = "The deployment environment (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "The environment must be either 'staging' or 'production'."
  }
}

# Requirement addressed: Resource Tagging
# Location: Technical Specification/6. INFRASTRUCTURE
variable "project_name" {
  description = "The name of the project for resource naming and tagging"
  type        = string
  default     = "pollen8"
}

# Requirement addressed: Configurable Caching
# Location: Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES
variable "vpc_id" {
  description = "The ID of the VPC where ElastiCache will be deployed"
  type        = string
}

# Requirement addressed: Configurable Caching
# Location: Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES
variable "private_subnet_ids" {
  description = "List of private subnet IDs for ElastiCache deployment"
  type        = list(string)
}

# Requirement addressed: Configurable Caching
# Location: Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES
variable "node_type" {
  description = "The compute and memory capacity of the nodes"
  type        = string
  default     = "cache.t3.micro"
}

# Requirement addressed: Configurable Caching
# Location: Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES
variable "num_cache_nodes" {
  description = "The number of cache nodes in the cluster"
  type        = number
  default     = 1
}

# Requirement addressed: Configurable Caching
# Location: Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES
variable "app_security_group_id" {
  description = "The ID of the application security group that needs access to Redis"
  type        = string
}

# Additional variables for enhanced configuration and security

variable "port" {
  description = "The port number on which the cache accepts connections"
  type        = number
  default     = 6379
}

variable "parameter_group_name" {
  description = "Name of the parameter group to associate with this cache cluster"
  type        = string
  default     = "default.redis6.x"
}

variable "engine_version" {
  description = "Version number of the cache engine"
  type        = string
  default     = "6.x"
}

variable "maintenance_window" {
  description = "Specifies the weekly time range for when maintenance on the cache cluster is performed"
  type        = string
  default     = "sun:05:00-sun:06:00"
}

variable "snapshot_retention_limit" {
  description = "The number of days for which ElastiCache will retain automatic cache cluster snapshots before deleting them"
  type        = number
  default     = 7
}

variable "snapshot_window" {
  description = "The daily time range (in UTC) during which ElastiCache will begin taking a daily snapshot of your cache cluster"
  type        = string
  default     = "03:00-04:00"
}

variable "apply_immediately" {
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window"
  type        = bool
  default     = false
}

variable "at_rest_encryption_enabled" {
  description = "Whether to enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Whether to enable encryption in transit"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "The password used to access a password protected server. Can be specified only if transit_encryption_enabled = true"
  type        = string
  default     = null
  sensitive   = true
}

# Tags for resource management and cost allocation
variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}