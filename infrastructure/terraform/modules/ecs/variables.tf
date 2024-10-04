# This file defines the input variables required for the ECS (Elastic Container Service) Terraform module,
# which is responsible for setting up the containerized infrastructure for the Pollen8 platform.

# Requirement: Container Orchestration Configuration
# Location: Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES
# Description: Defines variables for ECS Fargate setup
variable "environment" {
  description = "The deployment environment (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_name" {
  description = "The name of the project for resource tagging"
  type        = string
}

# Requirement: Network Integration
# Location: Technical Specification/6. INFRASTRUCTURE/6.4 ORCHESTRATION
# Description: Allows specification of VPC and subnet configurations
variable "vpc_id" {
  description = "The ID of the VPC where ECS resources will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

# Requirement: Resource Scaling
# Location: Technical Specification/6. INFRASTRUCTURE/6.4.1 ECS Configuration
# Description: Enables configuration of task resources and counts
variable "ecs_task_cpu" {
  description = "The amount of CPU to allocate for each ECS task"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "The amount of memory to allocate for each ECS task"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "The desired number of ECS tasks to run"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "The maximum number of ECS tasks for auto scaling"
  type        = number
  default     = 10
}

variable "ecs_min_capacity" {
  description = "The minimum number of ECS tasks for auto scaling"
  type        = number
  default     = 2
}

variable "ecr_repository_url" {
  description = "The URL of the ECR repository containing container images"
  type        = string
}

variable "frontend_image_tag" {
  description = "The tag for the frontend container image"
  type        = string
  default     = "latest"
}

variable "backend_image_tag" {
  description = "The tag for the backend container image"
  type        = string
  default     = "latest"
}

variable "socket_image_tag" {
  description = "The tag for the socket container image"
  type        = string
  default     = "latest"
}

variable "health_check_path" {
  description = "The path for load balancer health checks"
  type        = string
  default     = "/health"
}

variable "health_check_interval" {
  description = "The interval between health checks in seconds"
  type        = number
  default     = 30
}