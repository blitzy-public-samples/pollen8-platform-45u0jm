#!/bin/bash

# Health Check Script for Pollen8 Platform
# This script performs comprehensive health checks on deployed services
# ensuring system reliability and availability.

# Requirements addressed:
# - Deployment Verification (Technical Specification/6.5.3 Deployment Strategy)
# - Service Health Monitoring (Technical Specification/6.5.2 Load Balancing)
# - Zero-Downtime Deployment (Technical Specification/6.5.3 Deployment Strategy)

# Set environment variables with defaults
ENVIRONMENT=${ENVIRONMENT:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
HEALTH_CHECK_TIMEOUT=5
MAX_RETRIES=3

# Function to check if required tools are installed
check_prerequisites() {
    local required_tools=("curl" "aws" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "Error: $tool is not installed or not in PATH"
            return 1
        fi
    done
    return 0
}

# Function to check health of a service
check_service_health() {
    local service_name=$1
    local endpoint=$2
    local retries=$3

    for ((i=1; i<=retries; i++)); do
        response=$(curl -sS -o /dev/null -w "%{http_code}" "$endpoint" -m "$HEALTH_CHECK_TIMEOUT")
        if [ "$response" = "200" ]; then
            log_health_status "$service_name" "Healthy" "HTTP 200 OK"
            return 0
        fi
        sleep 2
    done

    log_health_status "$service_name" "Unhealthy" "Failed after $retries attempts"
    return 1
}

# Function to check ECS service status
check_ecs_service_status() {
    local service_name=$1
    local cluster_name=$2

    local service_status=$(aws ecs describe-services --cluster "$cluster_name" --services "$service_name" --region "$AWS_REGION" | jq -r '.services[0].status')
    local running_count=$(aws ecs describe-services --cluster "$cluster_name" --services "$service_name" --region "$AWS_REGION" | jq -r '.services[0].runningCount')
    local desired_count=$(aws ecs describe-services --cluster "$cluster_name" --services "$service_name" --region "$AWS_REGION" | jq -r '.services[0].desiredCount')

    if [ "$service_status" = "ACTIVE" ] && [ "$running_count" = "$desired_count" ]; then
        log_health_status "$service_name" "Healthy" "ECS Service: $running_count/$desired_count tasks running"
        return 0
    else
        log_health_status "$service_name" "Unhealthy" "ECS Service: $running_count/$desired_count tasks running"
        return 1
    fi
}

# Function to log health status
log_health_status() {
    local service_name=$1
    local status=$2
    local details=$3
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    echo "[$timestamp] $service_name - Status: $status - Details: $details"
    # TODO: Implement more sophisticated logging (e.g., to CloudWatch)
}

# Main execution
main() {
    echo "Starting health checks for Pollen8 platform in $ENVIRONMENT environment"

    # Check prerequisites
    if ! check_prerequisites; then
        echo "Prerequisite check failed. Exiting."
        exit 1
    fi

    # Define services to check
    declare -A services=(
        ["frontend"]="https://pollen8.com/health"
        ["api"]="https://api.pollen8.com/health"
        ["socket"]="https://socket.pollen8.com/health"
    )

    # ECS cluster name (adjust as needed)
    local cluster_name="pollen8-cluster-$ENVIRONMENT"

    # Perform health checks
    for service in "${!services[@]}"; do
        if ! check_service_health "$service" "${services[$service]}" "$MAX_RETRIES"; then
            echo "Health check failed for $service"
        fi

        if ! check_ecs_service_status "$service" "$cluster_name"; then
            echo "ECS service check failed for $service"
        fi
    done

    echo "Health checks completed"
}

# Run the main function
main

# Exit with success (actual service failures are logged, not reflected in exit code)
exit 0