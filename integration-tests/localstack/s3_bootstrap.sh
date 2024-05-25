#!/bin/bash

# Set environment variables for AWS CLI
export AWS_ACCESS_KEY_ID="AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="AWS_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="eu-central-1"
export AWS_ENDPOINT_URL="http://localhost:4566"

# Create the S3 bucket
echo "Creating S3 bucket..."
aws --endpoint-url=$AWS_ENDPOINT_URL s3 mb s3://bucket-name

# Enable versioning
aws --endpoint-url=$AWS_ENDPOINT_URL  s3api put-bucket-versioning --bucket bucket-name --versioning-configuration Status=Enabled

# # Set the CORS policy
# echo "Applying CORS policy..."
aws --endpoint-url=$AWS_ENDPOINT_URL s3api put-bucket-cors --bucket bucket-name --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["'"$EXCHANGE_APP_BASE_URL"'"],
      "ExposeHeaders": []
    }
  ]
}'
