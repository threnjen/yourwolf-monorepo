# Phase 13: Production Deployment

**Status**: Planned
**Depends on**: Phase 12 (Analytics & Balance Metrics)
**Estimated complexity**: Large
**Cross-references**: Existing Docker setup `yourwolf-backend/Dockerfile`, `yourwolf-backend/docker-compose.yml`

## Objective

Deploy the cloud backend to AWS with production-grade infrastructure and CI/CD, and submit the desktop and mobile apps to their respective app stores for public distribution.

## Scope

### In Scope
- **Cloud Infrastructure** (AWS):
  - Infrastructure as Code via Terraform: VPC, subnets, security groups
  - RDS PostgreSQL: production database with automated backups, encryption at rest
  - ECS Fargate: containerized backend with auto-scaling
  - ECR: container image registry for backend Docker images
  - ALB: application load balancer with health checks, HTTPS redirect
  - ACM: SSL certificates for custom domain
  - Route 53: DNS for custom domain
  - Cognito: production user pool with social login support (Google, Apple)
  - IAM: least-privilege policies
  - Secrets Manager: database credentials, API keys
  - CloudWatch: logging, alarms (CPU, memory, 5xx, RDS connections)
  - SNS: alert notifications
- **CI/CD**:
  - GitHub Actions: test → build → deploy for backend
  - GitHub Actions: test → build → sign → release for desktop (macOS, Windows, Linux)
  - GitHub Actions: test → build → sign → submit for mobile (iOS TestFlight, Android internal testing)
  - Database migration automation in deploy pipeline
- **App Store Submissions**:
  - macOS: App Store submission or notarized DMG distribution
  - Windows: Microsoft Store submission or signed installer distribution
  - iOS: App Store submission via TestFlight → production
  - Android: Google Play Store submission via internal testing → production
- Social login support: Google and Apple sign-in added to Cognito

### Out of Scope
- Multi-region deployment
- Blue/green or canary deployments (rolling update sufficient initially)
- WAF (add if needed post-launch)
- Cost optimization beyond right-sizing
- Staging environment (production only for now)
- Analytics/metrics dashboards for infrastructure (CloudWatch sufficient)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Terraform Foundation | VPC, subnets, security groups, IAM roles | Infrastructure config |
| 2 | Database | RDS PostgreSQL with backups, encryption, Secrets Manager | Terraform + config |
| 3 | Compute | ECS Fargate cluster, task definition, service, auto-scaling | Terraform + Dockerfile |
| 4 | Networking | ALB, HTTPS, ACM certificate, Route 53 DNS | Terraform config |
| 5 | Auth Production | Cognito production pool with social logins (Google, Apple) | Terraform + config |
| 6 | Backend CI/CD | GitHub Actions: test → build → push to ECR → deploy to ECS | Workflow YAML |
| 7 | Desktop Release Pipeline | GitHub Actions: build → sign → release (macOS DMG, Windows MSI, Linux AppImage) | Workflow YAML |
| 8 | Mobile Release Pipeline | GitHub Actions: build → sign → submit to TestFlight and Play Store | Workflow YAML |
| 9 | App Store Submissions | App metadata, screenshots, app review compliance for all stores | Store listings |
| 10 | Monitoring | CloudWatch alarms, SNS alerts, health check endpoints | Terraform + config |

## Technical Context

- Existing Docker setup: `yourwolf-backend/Dockerfile`, `yourwolf-backend/docker-compose.yml` — production Dockerfile may need multi-stage build optimization
- Backend config: `app/config.py` — needs environment-aware settings (dev vs. production)
- Alembic: migrations need to run as part of deploy pipeline
- Tauri builds (Phase 06/08): already produce platform binaries; this phase adds signing and store submission
- Desktop CI (Phase 06): extends existing GitHub Actions with code signing and release distribution
- Mobile CI (Phase 08): extends existing GitHub Actions with store submission automation
- Infrastructure directory: `infrastructure/` (new, at monorepo root) for Terraform files
- Cognito (Phase 09): dev pool upgraded to production; social logins added

## Dependencies & Risks

- **Dependency**: AWS account with billing configured
- **Dependency**: Custom domain registered (Route 53 or external DNS)
- **Dependency**: Apple Developer account ($99/year) for macOS and iOS signing + store
- **Dependency**: Google Play Developer account ($25 one-time)
- **Dependency**: Code signing certificates for Windows
- **Risk**: Terraform state management — use S3 backend with DynamoDB locking
- **Risk**: First deploy complexity — mitigate with incremental provisioning
- **Risk**: App store review rejections — plan for multiple submission cycles for each store
- **Risk**: Cost surprises — RDS and NAT gateways drive costs; set AWS billing alerts
- **Mitigation**: Start with smallest instance sizes; scale based on load

## Success Criteria

- [ ] Terraform provisions all AWS infrastructure without errors
- [ ] Backend deploys automatically on push to main
- [ ] RDS PostgreSQL is accessible; migrations run successfully
- [ ] API accessible at custom domain with SSL
- [ ] Cognito social logins (Google, Apple) work
- [ ] Desktop apps are signed and distributed (notarized DMG, signed MSI)
- [ ] iOS app approved and live on App Store
- [ ] Android app approved and live on Google Play Store
- [ ] Monitoring alarms fire correctly on simulated failure
- [ ] Auto-updater in desktop apps detects and installs new releases

## QA Considerations

- End-to-end testing on production: signup → verify → login → create role → publish → game → history
- Test social logins on all platforms
- Test auto-update on desktop (release new version → existing install updates)
- App store review compliance: privacy policy, data handling disclosures
- Load testing on the cloud backend (simulate concurrent users)

## Notes for Feature - Decomposer

Three parallel tracks: AWS infrastructure (Terraform), backend CI/CD, and app distribution (desktop + mobile). These can be developed largely in parallel after the Terraform foundation is in place. Decomposition: Terraform foundation → database → compute → networking → auth production → backend CI/CD → desktop release pipeline → mobile release pipeline → app store submissions → monitoring.
