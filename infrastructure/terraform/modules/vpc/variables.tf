# This file defines the input variables required for the VPC (Virtual Private Cloud) Terraform module,
# which is responsible for creating the network infrastructure for the Pollen8 platform.

# Requirement: Environment Flexibility
# Location: Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT
# Description: Enables environment-specific network configurations
variable "environment" {
  description = "The deployment environment (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

# Requirement: Resource Identification
# Location: Technical Specification/6. INFRASTRUCTURE/6.2 CLOUD SERVICES
# Description: Provides variables for consistent resource naming and tagging
variable "project_name" {
  description = "The name of the project for resource tagging"
  type        = string
  default     = "pollen8"
}

# Requirement: Network Configuration
# Location: Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES
# Description: Defines customizable network parameters for VPC setup
variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use for subnets"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in the VPC"
  type        = bool
  default     = true
}