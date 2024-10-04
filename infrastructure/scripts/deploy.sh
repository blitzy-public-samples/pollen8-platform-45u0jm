#!/bin/bash

# Pollen8 Platform Deployment Script
# This script automates the deployment process for the Pollen8 platform,
# ensuring reliable and consistent deployments across environments.

# Set strict mode
set -euo pipefail

# Global variables
ENVIRONMENT=${ENVIRONMENT:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
TIMEOUT=300
SERVICES=("frontend" "api" "socket" "backend")

# Load environment-specific variables
if [[ -f ".env.${ENVIRONMENT}" ]]; then
    source ".env.${ENVIRONMENT}"
else
    echo "Error: Environment file .env.${ENVIRONMENT} not found."
    exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    local required_tools=("aws" "docker" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "Error: $tool is required but not installed."
            exit 1
        fi
    done
}

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local image_tag=$2
    
    echo "Deploying $service_name..."
    
    # Update ECS task definition
    local task_def=$(aws ecs describe-task-definition --task-definition "$service_name" --region "$AWS_REGION")
    local new_task_def=$(echo "$task_def" | jq --arg IMAGE "$image_tag" '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities)')
    local new_task_def_arn=$(aws ecs register-task-definition --region "$AWS_REGION" --cli-input-json "$new_task_def" | jq -r '.taskDefinition.taskDefinitionArn')
    
    # Update ECS service
    aws ecs update-service --cluster pollen8-cluster --service "$service_name" --task-definition "$new_task_def_arn" --region "$AWS_REGION"
    
    # Wait for deployment to complete
    if ! wait_for_steady_state "$service_name"; then
        echo "Error: Deployment of $service_name failed to reach steady state."
        exit 1
    fi
}

# Function to wait for service to reach steady state
wait_for_steady_state() {
    local service_name=$1
    local start_time=$(date +%s)
    
    while true; do
        local status=$(aws ecs describe-services --cluster pollen8-cluster --services "$service_name" --region "$AWS_REGION" | jq -r '.services[0].deployments[0].rolloutState')
        if [[ "$status" == "COMPLETED" ]]; then
            echo "$service_name deployment completed successfully."
            return 0
        elif [[ "$status" == "FAILED" ]]; then
            echo "Error: $service_name deployment failed."
            return 1
        fi
        
        local current_time=$(date +%s)
        if (( current_time - start_time > TIMEOUT )); then
            echo "Error: Deployment of $service_name timed out."
            return 1
        fi
        
        sleep 10
    done
}

# Function to perform health check
perform_health_check() {
    local service_name=$1
    echo "Performing health check for $service_name..."
    
    if ! ./health-check.sh "$service_name"; then
        echo "Error: Health check failed for $service_name."
        return 1
    fi
    
    echo "Health check passed for $service_name."
    return 0
}

# Main deployment process
main() {
    check_prerequisites
    
    echo "Starting deployment for Pollen8 platform in $ENVIRONMENT environment..."
    
    # Build and push Docker images
    for service in "${SERVICES[@]}"; do
        local image_tag="pollen8/${service}:${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"
        docker build -t "$image_tag" -f "src/${service}/Dockerfile" "src/${service}"
        docker push "$image_tag"
        
        deploy_service "$service" "$image_tag"
        
        if ! perform_health_check "$service"; then
            echo "Error: Deployment failed for $service. Initiating rollback..."
            ./rollback.sh "$service"
            exit 1
        fi
    done
    
    echo "Deployment completed successfully for all services."
}

# Run the main function
main

exit 0