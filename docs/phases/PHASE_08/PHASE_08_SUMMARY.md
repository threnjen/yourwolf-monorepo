# Phase 8: AWS Deployment

**Status**: Planned
**Depends on**: Phase 07 (Analytics & Balance Metrics)
**Estimated complexity**: Large
**Cross-references**: None

## Objective

Deploy the application to AWS with production-grade infrastructure, CI/CD pipelines, monitoring, and alerting — making the app publicly accessible at a custom domain with SSL.

## Scope

### In Scope
- Infrastructure as Code via Terraform: VPC, subnets, security groups
- RDS PostgreSQL: production database with automated backups, encryption at rest
- ECS Fargate: containerized backend with auto-scaling (CPU-based)
- ECR: container image registry for backend Docker images
- S3 + CloudFront: static frontend hosting with CDN, origin access control
- ALB: application load balancer with health checks, HTTP→HTTPS redirect
- ACM: SSL certificates for custom domain
- Route 53: DNS configuration for custom domain
- Cognito: production user pool (upgrading from dev pool in Phase 04)
- IAM: execution roles, task roles, least-privilege policies
- Secrets Manager: database credentials, API keys
- GitHub Actions CI/CD: test → build → deploy pipeline triggered on push to main
- CloudWatch: log groups, CPU/memory/5xx/RDS connection alarms
- SNS: alert notifications via email
- Database migration automation in the deploy pipeline

### Out of Scope
- Multi-region deployment
- Blue/green or canary deployment strategies (rolling update is sufficient initially)
- CDN for API responses (only static frontend)
- WAF (Web Application Firewall) — add later if needed
- Cost optimization beyond right-sizing (reserved instances, savings plans)
- Social login configuration in Cognito (defer to post-launch)
- Staging environment (production only for MVP; add staging as a follow-up)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Terraform Foundation | VPC, subnets, security groups, IAM roles | Infrastructure config |
| 2 | Database | RDS PostgreSQL with backups, encryption, Secrets Manager | Terraform + config |
| 3 | Compute | ECS Fargate cluster, task definition, service, auto-scaling | Terraform + Dockerfile |
| 4 | Frontend Hosting | S3 bucket + CloudFront distribution with OAC | Terraform + deploy script |
| 5 | Networking | ALB, target group, HTTPS listener, ACM certificate, Route 53 | Terraform config |
| 6 | Auth | Cognito production user pool and client configuration | Terraform config |
| 7 | CI/CD Pipeline | GitHub Actions workflow: test → build → push to ECR → deploy to ECS + S3 | Workflow YAML |
| 8 | Monitoring | CloudWatch log groups, metric alarms, SNS topic + email subscription | Terraform config |

## Technical Context

- Existing Docker setup: `yourwolf-backend/Dockerfile`, `yourwolf-backend/docker-compose.yml` — production Dockerfile may need optimization (multi-stage build)
- Backend entry: `app/main.py` — needs environment-aware configuration (dev vs. production)
- Config: `app/config.py` — needs production settings for database URL, CORS origins, Cognito IDs
- Frontend build: `npm run build` produces static files in `dist/` for S3 upload
- Alembic: `alembic/` — migrations need to run as part of deploy pipeline (ECS task or pre-deploy step)
- Cognito config: environment variables from Phase 04 need production values
- Infrastructure directory: `infrastructure/` (new, at monorepo root) for all Terraform files

## Dependencies & Risks

- **Dependency**: AWS account with appropriate permissions and billing configured
- **Dependency**: Custom domain registered and nameservers pointed to Route 53
- **Dependency**: All prior phases complete and tested locally
- **Risk**: Terraform state management — use S3 backend with DynamoDB locking to prevent state corruption
- **Risk**: First deploy complexity — many moving parts; mitigate with incremental provisioning (VPC first, then RDS, then ECS, etc.)
- **Risk**: Database migration failures during deploy — mitigate with migration dry-runs and rollback procedures
- **Risk**: Cost surprises — RDS and NAT gateways are the main cost drivers; monitor AWS billing alerts
- **Mitigation**: Use smallest instance sizes initially (db.t3.micro, 0.25 vCPU Fargate tasks) and scale up based on load

## Success Criteria

- [ ] Terraform provisions all infrastructure without errors
- [ ] RDS PostgreSQL is accessible from ECS tasks; migrations run successfully
- [ ] ECS service is running and healthy (ALB health checks pass)
- [ ] Frontend loads from CloudFront with correct routing (SPA fallback)
- [ ] API accessible via CloudFront `/api/*` path routing to ALB
- [ ] HTTPS works with valid SSL certificate on custom domain
- [ ] Push to `main` triggers GitHub Actions deploy and succeeds end-to-end
- [ ] Cognito login works in production
- [ ] CloudWatch alarms fire on simulated high CPU/memory/5xx conditions
- [ ] SNS delivers alert email on alarm

## QA Considerations

- Full end-to-end testing required in production: signup → login → create role → create game → play
- SSL certificate validation and HTTPS redirect
- CloudFront cache invalidation after frontend deploys
- Database backup and restore should be tested at least once
- No frontend-specific QA doc needed; this is pure infrastructure — but all prior QA scenarios should be re-validated in production

## Notes for Feature - Decomposer

Suggested decomposition by infrastructure layer: (1) Terraform foundation (VPC, IAM, S3 backend for state), (2) database (RDS, Secrets Manager, security group), (3) compute (ECR, ECS cluster, task definition, service, ALB), (4) frontend hosting (S3, CloudFront, OAC), (5) networking and DNS (ACM certificate, Route 53, HTTPS listener), (6) auth (Cognito production pool), (7) CI/CD pipeline (GitHub Actions), (8) monitoring (CloudWatch, SNS). Provision in this order due to dependencies. Features 1 and 2 can be done first, then 3-6 in parallel to some extent, then 7-8 last.
