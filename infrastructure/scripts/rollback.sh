#!/bin/bash

# Pollen8 Platform Rollback Script
# This script handles automated rollback procedures for the Pollen8 platform
# in case of deployment failures, ensuring system reliability and minimal downtime.

# Set strict mode
set -euo pipefail

# Global variables
ENVIRONMENT=${ENVIRONMENT:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
TIMEOUT=300
SERVICES=('frontend' 'api' 'socket' 'backend')

# Function to check prerequisites
check_prerequisites() {
    local required_tools=("aws" "docker" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "Error: $tool is required but not installed." >&2
            exit 1
        fi
    done
}

# Function to rollback a service
rollback_service() {
    local service_name=$1
    local previous_task_definition=$2

    echo "Rolling back $service_name to previous task definition: $previous_task_definition"
    
    aws ecs update-service \
        --cluster pollen8-${ENVIRONMENT} \
        --service ${service_name} \
        --task-definition ${previous_task_definition} \
        --region ${AWS_REGION}

    echo "Rollback initiated for $service_name"
}

# Function to wait for rollback completion
wait_for_rollback_completion() {
    local service_name=$1
    local start_time=$(date +%s)

    while true; do
        local status=$(aws ecs describe-services \
            --cluster pollen8-${ENVIRONMENT} \
            --services ${service_name} \
            --region ${AWS_REGION} \
            --query 'services[0].deployments[0].status' \
            --output text)

        if [[ "$status" == "PRIMARY" ]]; then
            echo "$service_name rollback completed successfully"
            return 0
        fi

        local current_time=$(date +%s)
        if (( current_time - start_time >= TIMEOUT )); then
            echo "Timeout reached while waiting for $service_name rollback"
            return 1
        fi

        echo "Waiting for $service_name rollback to complete..."
        sleep 10
    done
}

# Function to verify rollback health
verify_rollback_health() {
    local service_name=$1

    # TODO: Implement health check logic here
    # This should be replaced with actual health check implementation
    # For now, we'll use a simple check based on ECS service status

    local desired_count=$(aws ecs describe-services \
        --cluster pollen8-${ENVIRONMENT} \
        --services ${service_name} \
        --region ${AWS_REGION} \
        --query 'services[0].desiredCount' \
        --output text)

    local running_count=$(aws ecs describe-services \
        --cluster pollen8-${ENVIRONMENT} \
        --services ${service_name} \
        --region ${AWS_REGION} \
        --query 'services[0].runningCount' \
        --output text)

    if [[ "$desired_count" == "$running_count" ]]; then
        echo "$service_name health check passed"
        return 0
    else
        echo "$service_name health check failed"
        return 1
    fi
}

# Main rollback procedure
main() {
    check_prerequisites

    echo "Starting rollback procedure for Pollen8 platform in $ENVIRONMENT environment"

    for service in "${SERVICES[@]}"; do
        echo "Processing rollback for $service"

        # Get the previous task definition
        previous_task_definition=$(aws ecs describe-services \
            --cluster pollen8-${ENVIRONMENT} \
            --services ${service} \
            --region ${AWS_REGION} \
            --query 'services[0].taskDefinition' \
            --output text)

        # Perform rollback
        rollback_service "$service" "$previous_task_definition"

        # Wait for rollback completion
        if wait_for_rollback_completion "$service"; then
            echo "Rollback completed for $service"
        else
            echo "Rollback failed for $service"
            exit 1
        fi

        # Verify health after rollback
        if verify_rollback_health "$service"; then
            echo "Health check passed for $service"
        else
            echo "Health check failed for $service"
            exit 1
        fi
    done

    echo "Rollback procedure completed successfully for all services"
}

# Execute main function
main

# Exit successfully
exit 0