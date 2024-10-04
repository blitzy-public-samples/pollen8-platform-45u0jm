# This file defines the output values for the ECS (Elastic Container Service) Terraform module,
# making essential ECS resource information available for use by the root module and other parts of the infrastructure.

# Cluster Outputs
output "cluster_id" {
  description = "The ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "The ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

# Service Outputs
output "frontend_service_name" {
  description = "The name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "backend_service_name" {
  description = "The name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "socket_service_name" {
  description = "The name of the socket ECS service"
  value       = aws_ecs_service.socket.name
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "frontend_target_group_arn" {
  description = "The ARN of the frontend target group"
  value       = aws_lb_target_group.frontend.arn
}

output "backend_target_group_arn" {
  description = "The ARN of the backend target group"
  value       = aws_lb_target_group.backend.arn
}

output "socket_target_group_arn" {
  description = "The ARN of the socket target group"
  value       = aws_lb_target_group.socket.arn
}

# Security Group Outputs
output "ecs_tasks_security_group_id" {
  description = "The ID of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.id
}

output "alb_security_group_id" {
  description = "The ID of the Application Load Balancer security group"
  value       = aws_security_group.alb.id
}

# Additional outputs for enhanced usability and integration
output "cluster_capacity_providers" {
  description = "List of capacity providers associated with the ECS cluster"
  value       = aws_ecs_cluster.main.capacity_providers
}

output "services_desired_count" {
  description = "Map of service names to their desired task counts"
  value = {
    frontend = aws_ecs_service.frontend.desired_count
    backend  = aws_ecs_service.backend.desired_count
    socket   = aws_ecs_service.socket.desired_count
  }
}

output "alb_listener_arns" {
  description = "ARNs of the ALB listeners"
  value = {
    http  = aws_lb_listener.http.arn
    https = aws_lb_listener.https.arn
  }
}

output "cloudwatch_log_groups" {
  description = "Names of the CloudWatch log groups for ECS services"
  value = {
    frontend = aws_cloudwatch_log_group.frontend.name
    backend  = aws_cloudwatch_log_group.backend.name
    socket   = aws_cloudwatch_log_group.socket.name
  }
}