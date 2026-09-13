# ☁️ Amazon Web Services (AWS) Deployment Guide

This guide provides end-to-end instructions for deploying the **Loan Document Processing Agent** on AWS.

---

## 🏛️ Recommended AWS Architecture

```text
  [ User Browser ]
         │
         ├──► [ AWS CloudFront + S3 ] ──► Serves React Frontend (HTTPS)
         │
         └──► [ AWS App Runner / ECS Fargate / ALB ] ──► FastAPI Multi-Agent Backend
                     │
                     ├──► [ Amazon S3 ] ──► Encrypted Private Document Storage
                     └──► [ Amazon RDS PostgreSQL ] ──► Application Database
```

* **Frontend**: Hosted on **Amazon S3** + **Amazon CloudFront** CDN (or AWS Amplify).
* **Backend**: Containerized FastAPI service running on **AWS App Runner** (recommended for zero-ops deployment) or **AWS ECS Fargate**.
* **Storage**: **Amazon S3** private bucket with SSE-S3 / KMS encryption for all uploaded loan documents.
* **Database**: **Amazon RDS PostgreSQL** (or SQLite on persistent volume/EFS).

---

## 1. Prerequisites

1. Install the [AWS CLI v2](https://aws.amazon.com/cli/) and authenticate:
   ```bash
   aws configure
   ```
2. Install [Docker](https://www.docker.com/) for building container images.
3. Ensure you have an active AWS account with permissions for S3, ECR, App Runner / ECS, and IAM.

---

## 2. Amazon S3 Document Storage Setup

### Step 2.1: Create Private S3 Bucket

```bash
# Choose a globally unique bucket name and your AWS region
BUCKET_NAME="loan-documents-prod-$(aws sts get-caller-identity --query Account --output text)"
REGION="ap-south-1"

# Create S3 Bucket
aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"

# Block all public access (Crucial for banking & PII compliance)
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable default AES-256 Server-Side Encryption
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'

# Apply CORS configuration for browser uploads
aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file://aws/s3-cors.json
```

---

## 3. IAM Role Configuration

When deploying on AWS App Runner or ECS Fargate, do not hardcode AWS credentials. Use an IAM role attached to the service.

### IAM Policy for S3 Document Access:
Attach this policy to your ECS Task Role or App Runner Instance Role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    }
  ]
}
```

---

## 4. Option A: Deploy Backend with AWS App Runner (Recommended)

AWS App Runner provides fully managed container execution with automatic scaling, SSL termination, and health checks.

### Step 4.1: Create Amazon ECR Repository & Push Container

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/loan-document-agent-backend"

# Create ECR repo
aws ecr create-repository --repository-name loan-document-agent-backend --region $REGION

# Authenticate Docker to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build and tag image
docker build -t loan-document-agent-backend:latest ./backend-code
docker tag loan-document-agent-backend:latest "$ECR_URI:latest"

# Push image
docker push "$ECR_URI:latest"
```

### Step 4.2: Create App Runner Service

Create the App Runner service via AWS Console or CLI pointing to your ECR image:
* **Port**: `8000`
* **Health Check Path**: `/health`
* **Environment Variables**:
  * `APP_ENV`: `production`
  * `PORT`: `8000`
  * `HOST`: `0.0.0.0`
  * `AWS_REGION`: `ap-south-1`
  * `AWS_S3_BUCKET`: `<YOUR_BUCKET_NAME>`
  * `CORS_ORIGINS`: `https://your-frontend-domain.com`

---

## 5. Option B: Deploy Backend with AWS ECS Fargate

1. Register task definition:
   ```bash
   aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json
   ```
2. Create or update your ECS Fargate Service attached to an Application Load Balancer (ALB).
3. Set the target group health check path to `/health`.

---

## 6. Frontend Deployment (S3 + CloudFront CDN)

### Step 6.1: Build Frontend for Production

Set `VITE_API_URL` to your live App Runner or ALB backend URL:
```bash
cd "hackathon UI"
npm install
VITE_API_URL="https://your-backend-apprunner-url.awsapprunner.com" npm run build
```

### Step 6.2: Deploy to S3 Website Bucket

```bash
FRONTEND_BUCKET="loan-agent-frontend-$ACCOUNT_ID"

aws s3 mb s3://$FRONTEND_BUCKET --region $REGION
aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete
```

### Step 6.3: CloudFront Distribution

Create a CloudFront distribution pointing to the S3 bucket with:
* **Default Root Object**: `index.html`
* **Custom Error Response**: HTTP 403 & 404 $\rightarrow$ Return `/index.html` with status `200` (required for React SPA client-side routing).

---

## 7. Verification & Production Health Checks

After deployment, test the live endpoints:

1. **Health Check**:
   ```bash
   curl -i https://your-backend-url/health
   # Expected response: {"status":"healthy","service":"loan-document-processing-agent","version":"3.5.0",...}
   ```
2. **API Documentation**:
   Visit `https://your-backend-url/docs` for interactive OpenAPI Swagger documentation.
3. **Frontend Application**:
   Navigate to your CloudFront URL and perform a test document upload.

---

## 8. Resource Cleanup

To avoid ongoing AWS charges after evaluation:
```bash
# Empty and delete S3 document bucket
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME

# Delete ECR repository
aws ecr delete-repository --repository-name loan-document-agent-backend --force
```
