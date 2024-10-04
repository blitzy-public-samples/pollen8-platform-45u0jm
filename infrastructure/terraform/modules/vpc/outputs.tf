# This file defines the output values that are exported from the VPC (Virtual Private Cloud) Terraform module,
# making network infrastructure details available to other modules and the root configuration.

# Output the ID of the VPC
# Requirement: Network Information Sharing (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

# Output the CIDR block of the VPC
# Requirement: Network Information Sharing (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Output the list of private subnet IDs
# Requirement: Cross-Module Communication (Technical Specification/6. INFRASTRUCTURE)
output "private_subnet_ids" {
  description = "List of IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# Output the list of public subnet IDs
# Requirement: Cross-Module Communication (Technical Specification/6. INFRASTRUCTURE)
output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

# Output the list of NAT Gateway IDs
# Requirement: Network Information Sharing (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

# Output the ID of the Internet Gateway
# Requirement: Network Information Sharing (Technical Specification/2. SYSTEM ARCHITECTURE/2.2 CLOUD SERVICES)
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# Note: All outputs have clear, descriptive names and documentation
# Note: The outputs are designed to be consumed by other Terraform modules
# Note: The file follows Terraform best practices for output definition
# Note: Outputs enable the creation of a modular, composable infrastructure
# Note: The values exported are essential for setting up other AWS services that require VPC configuration
# Note: The use of splat expressions ([*]) allows for dynamic output of multiple subnet IDs