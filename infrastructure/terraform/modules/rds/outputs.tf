# This file defines the output values for the RDS (MongoDB Atlas) Terraform module,
# exposing necessary database connection details and resource identifiers for use
# by other modules or the root configuration.

# Output: cluster_name
# Description: The name of the MongoDB Atlas cluster
# Requirement Addressed: Resource References (Technical Specification/6. INFRASTRUCTURE)
output "cluster_name" {
  description = "The name of the MongoDB Atlas cluster"
  value       = mongodbatlas_cluster.main.name
}

# Output: connection_string
# Description: The connection string for the MongoDB Atlas cluster
# Requirement Addressed: Database Connectivity (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
# Security Integration (Technical Specification/5. SECURITY CONSIDERATIONS)
output "connection_string" {
  description = "The connection string for the MongoDB Atlas cluster"
  value       = mongodbatlas_cluster.main.connection_strings[0].standard
  sensitive   = true
}

# Output: srv_connection_string
# Description: The SRV connection string for the MongoDB Atlas cluster
# Requirement Addressed: Database Connectivity (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
# Security Integration (Technical Specification/5. SECURITY CONSIDERATIONS)
output "srv_connection_string" {
  description = "The SRV connection string for the MongoDB Atlas cluster"
  value       = mongodbatlas_cluster.main.connection_strings[0].standard_srv
  sensitive   = true
}

# Output: project_id
# Description: The ID of the MongoDB Atlas project
# Requirement Addressed: Resource References (Technical Specification/6. INFRASTRUCTURE)
output "project_id" {
  description = "The ID of the MongoDB Atlas project"
  value       = mongodbatlas_project.main.id
}

# Output: database_name
# Description: The name of the MongoDB database
# Requirement Addressed: Database Connectivity (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
output "database_name" {
  description = "The name of the MongoDB database"
  value       = var.mongodb_database_name
}

# Output: cluster_endpoint
# Description: The endpoint for the MongoDB Atlas cluster
# Requirement Addressed: Database Connectivity (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
# Security Integration (Technical Specification/5. SECURITY CONSIDERATIONS)
output "cluster_endpoint" {
  description = "The endpoint for the MongoDB Atlas cluster"
  value       = mongodbatlas_cluster.main.mongo_uri
  sensitive   = true
}