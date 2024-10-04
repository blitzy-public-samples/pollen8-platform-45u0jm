# This file defines the input variables for the RDS (MongoDB Atlas) Terraform module,
# enabling flexible and environment-specific database configurations for the Pollen8 platform.

# Requirements addressed:
# - Database Configuration (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
# - Environment Flexibility (Technical Specification/6. INFRASTRUCTURE/6.1 DEPLOYMENT ENVIRONMENT)
# - Security Parameters (Technical Specification/5. SECURITY CONSIDERATIONS)

variable "mongodb_atlas_org_id" {
  description = "The organization ID for MongoDB Atlas"
  type        = string
}

variable "project_name" {
  description = "The name of the project for resource naming"
  type        = string
}

variable "environment" {
  description = "The deployment environment (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "mongodb_instance_size" {
  description = "The instance size for MongoDB Atlas cluster"
  type        = string
  default     = "M10"
}

variable "mongodb_version" {
  description = "The version of MongoDB to use"
  type        = string
  default     = "5.0"
}

variable "mongodb_username" {
  description = "The username for MongoDB Atlas database access"
  type        = string
}

variable "mongodb_password" {
  description = "The password for MongoDB Atlas database access"
  type        = string
  sensitive   = true
}

variable "mongodb_database_name" {
  description = "The name of the MongoDB database to create"
  type        = string
  default     = "pollen8"
}

variable "vpc_id" {
  description = "The ID of the VPC to peer with MongoDB Atlas"
  type        = string
}

variable "vpc_cidr_block" {
  description = "The CIDR block of the VPC for peering"
  type        = string
}

variable "private_subnet_ids" {
  description = "The IDs of private subnets for database access"
  type        = list(string)
}

variable "aws_region" {
  description = "The AWS region for MongoDB Atlas deployment"
  type        = string
}