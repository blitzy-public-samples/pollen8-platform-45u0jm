# MongoDB Atlas configuration for Pollen8 platform

terraform {
  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

# Local values for reusability and consistency
locals {
  cluster_name    = "pollen8-${var.environment}"
  mongodb_version = "5.0" # Using a recent stable version
}

# Create MongoDB Atlas Project
resource "mongodbatlas_project" "main" {
  name   = "${var.project_name}-${var.environment}"
  org_id = var.mongodb_atlas_org_id
}

# Create MongoDB Atlas Cluster
resource "mongodbatlas_cluster" "main" {
  project_id   = mongodbatlas_project.main.id
  name         = local.cluster_name
  cluster_type = "REPLICASET"
  
  # Provider settings
  provider_name               = "AWS"
  provider_region_name        = var.aws_region
  provider_instance_size_name = var.mongodb_instance_size
  
  # MongoDB version
  mongo_db_major_version = local.mongodb_version
  
  # Cluster configuration
  auto_scaling_disk_gb_enabled = true
  
  replication_specs {
    num_shards = 1
    regions_config {
      region_name     = var.aws_region
      electable_nodes = 3
      priority        = 7
      read_only_nodes = 0
    }
  }
  
  # Backup configuration
  backup_enabled = true
  pit_enabled    = true
  
  # Advanced configuration
  advanced_configuration {
    javascript_enabled            = false
    minimum_enabled_tls_protocol  = "TLS1_2"
  }
}

# Network peering between Atlas and AWS VPC
resource "mongodbatlas_network_peering" "main" {
  project_id     = mongodbatlas_project.main.id
  container_id   = mongodbatlas_cluster.main.container_id
  provider_name  = "AWS"
  vpc_id         = var.vpc_id
  aws_account_id = data.aws_caller_identity.current.account_id
  route_table_cidr_block = var.vpc_cidr_block
  region_name    = var.aws_region
}

# Accept the network peering connection on the AWS side
resource "aws_vpc_peering_connection_accepter" "main" {
  vpc_peering_connection_id = mongodbatlas_network_peering.main.connection_id
  auto_accept               = true
}

# Create a database user for the application
resource "mongodbatlas_database_user" "main" {
  project_id         = mongodbatlas_project.main.id
  username           = var.mongodb_username
  password           = var.mongodb_password
  auth_database_name = "admin"
  
  roles {
    role_name     = "readWrite"
    database_name = var.mongodb_database_name
  }
  
  scopes {
    name = mongodbatlas_cluster.main.name
    type = "CLUSTER"
  }
}

# Data source to get AWS account ID
data "aws_caller_identity" "current" {}

# Outputs for other modules to use
output "mongodb_connection_string" {
  value       = mongodbatlas_cluster.main.connection_strings[0].standard
  description = "MongoDB Atlas connection string"
  sensitive   = true
}

output "mongodb_cluster_name" {
  value       = mongodbatlas_cluster.main.name
  description = "MongoDB Atlas cluster name"
}

output "mongodb_database_name" {
  value       = var.mongodb_database_name
  description = "MongoDB database name"
}