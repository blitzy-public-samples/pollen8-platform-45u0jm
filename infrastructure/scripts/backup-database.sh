#!/bin/bash

# Pollen8 Platform - MongoDB Backup Script
# This script automates the backup process of the MongoDB database for the Pollen8 platform.
# It ensures data safety and supports disaster recovery capabilities.

# Load environment variables
source /etc/environment

# Global variables
MONGODB_URI=${MONGODB_URI}
S3_BUCKET=${S3_BUCKET:-pollen8-backups}
BACKUP_PATH="/tmp/pollen8_backup"
AWS_REGION=${AWS_REGION:-us-east-1}
RETENTION_DAYS=30

# Function to check if required tools are installed
check_prerequisites() {
    local required_tools=("aws" "mongodump" "date")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo "Error: $tool is not installed. Please install it and try again."
            exit 1
        fi
    done
}

# Function to perform the database backup
perform_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="pollen8_backup_${timestamp}.gz"

    echo "Starting backup process at $(date)"
    
    # Perform MongoDB backup
    mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_PATH/$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "Backup completed successfully: $backup_file"
        echo "Backup size: $(du -h "$BACKUP_PATH/$backup_file" | cut -f1)"
    else
        echo "Error: Backup failed"
        exit 1
    fi

    return 0
}

# Function to upload backup to S3
upload_to_s3() {
    local backup_file=$1
    
    echo "Uploading backup to S3 bucket: $S3_BUCKET"
    aws s3 cp "$BACKUP_PATH/$backup_file" "s3://$S3_BUCKET/$backup_file" --region "$AWS_REGION"
    
    if [ $? -eq 0 ]; then
        echo "Upload completed successfully"
        # Remove local backup file after successful upload
        rm "$BACKUP_PATH/$backup_file"
    else
        echo "Error: Upload to S3 failed"
        exit 1
    fi
}

# Function to clean up old backups
cleanup_old_backups() {
    echo "Cleaning up backups older than $RETENTION_DAYS days"
    aws s3 ls "s3://$S3_BUCKET/" | while read -r line; do
        create_date=$(echo "$line" | awk '{print $1" "$2}')
        create_date_epoch=$(date -d "$create_date" +%s)
        current_date_epoch=$(date +%s)
        age_days=$(( (current_date_epoch - create_date_epoch) / 86400 ))
        
        if [ "$age_days" -gt "$RETENTION_DAYS" ]; then
            file_name=$(echo "$line" | awk '{print $4}')
            echo "Deleting old backup: $file_name"
            aws s3 rm "s3://$S3_BUCKET/$file_name" --region "$AWS_REGION"
        fi
    done
}

# Main execution
main() {
    check_prerequisites
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_PATH"
    
    local backup_file
    if perform_backup; then
        backup_file=$(ls -t "$BACKUP_PATH" | head -n1)
        upload_to_s3 "$backup_file"
        cleanup_old_backups
    else
        echo "Backup process failed"
        exit 1
    fi
    
    echo "Backup process completed at $(date)"
}

# Run the main function
main

# Exit successfully
exit 0