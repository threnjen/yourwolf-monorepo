# Phase 12: Analytics & Balance Metrics

**Status**: Planned
**Depends on**: Phase 11 (Advanced Features)
**Estimated complexity**: Large
**Cross-references**: Phase 11 game history models, Phase 10 role sets

## Objective

Build analytics infrastructure to track game outcomes, calculate role balance metrics, and provide intelligent suggestions for balanced game sets based on community play data.

## Scope

### In Scope
- Role statistics aggregation: win rate per role by team, by player count, over time periods
- Set statistics: overall balance score, game count, average duration per set
- Balance score calculation: roles near 50% win rate score highest (0-100 scale)
- Set recommendation engine: suggest balanced sets for a given player count
- Balance suggestion service: given a set of roles, suggest additions/removals to improve balance
- Analytics API endpoints: role performance, set recommendations, balance suggestions, community overview
- Facilitator dashboard page: personal game stats, win distribution, frequently used roles
- Community statistics section: global game counts, popular roles, trending sets
- Local analytics: basic personal stats computed from local game history (works offline)
- Cloud analytics: aggregated community stats from all synced game history
- Background aggregation jobs: daily/weekly stats rollup on the cloud backend
- `balance_score` column on roles table (cloud)

### Out of Scope
- Real-time analytics or streaming (batch aggregation only)
- A/B testing framework for balance changes
- Machine learning models for balance prediction
- Player-level analytics (individual player win rates)
- Export or download of analytics data
- Public API access to analytics (authenticated only)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Statistics Models | RoleStatistics, SetStatistics tables (PostgreSQL) | Models, migrations |
| 2 | Stats Aggregator | Service to compute aggregated statistics from game history | Backend service |
| 3 | Balance Score Engine | Calculate balance score (0-100) from win rates; 50% = highest | Backend service |
| 4 | Recommendation Engine | Suggest balanced sets for player count; suggest improvements | Backend service |
| 5 | Analytics API | Endpoints: role performance, recommendations, balance, community overview | Router, schemas |
| 6 | Local Stats | Personal game stats computed from local SQLite game history | TypeScript service |
| 7 | Facilitator Dashboard | Personal stats, win distribution, recent games, frequently used roles | Frontend page |
| 8 | Community Stats | Global aggregates, popular roles, trending sets (cloud-only) | Frontend section |
| 9 | Background Jobs | Daily/weekly aggregation jobs on the backend | Job scripts, scheduler |

## Technical Context

- Game history (Phase 11): local SQLite + cloud PostgreSQL — source data for all aggregations
- Role model: `app/models/role.py` — needs `balance_score` column
- Role sets (Phase 10): `role_sets` table — set-level statistics
- Local stats service: TypeScript, queries local SQLite game history — works offline
- Cloud stats: Python backend aggregation — requires connectivity
- Background jobs: Python `schedule` or APScheduler for backend cron
- The facilitator dashboard shows local stats when offline, enriched with community stats when online

## Dependencies & Risks

- **Dependency**: Phase 11 game history must be populated — analytics require completed game records
- **Dependency**: Phase 10 role sets must exist for set-level statistics
- **Risk**: Insufficient game data early on — balance scores unreliable with few games; show "not enough data" states
- **Risk**: Background job reliability — add logging and health checks
- **Risk**: Aggregation query performance on large datasets — use proper indexes and materialized views
- **Mitigation**: Start with local-only stats (always works), then layer cloud stats on top

## Success Criteria

- [ ] Local personal stats show game count, win distribution, frequently used roles (works offline)
- [ ] Cloud role statistics are aggregated from synced game history
- [ ] Balance score reflects win rate proximity to 50%
- [ ] Set recommendations return appropriate sets for requested player count
- [ ] Balance suggestions identify over/under-powered roles in a given set
- [ ] Facilitator dashboard shows local stats offline, enriched with community stats online
- [ ] Community overview shows global game count, popular roles, trending sets
- [ ] Background aggregation jobs run on schedule without errors
- [ ] API endpoints handle "not enough data" gracefully

## QA Considerations

- Dashboard displays require manual QA (charts, statistics, recommendations)
- Balance scores should be validated against manually calculated values from known game data
- Recommendation quality: verify suggestions make game-sense (correct team balance, player count)
- Test offline dashboard (local stats only) vs. online dashboard (local + community stats)

## Notes for Feature - Decomposer

Decomposition: statistics models → stats aggregator → balance score engine → recommendation engine → analytics API → local stats service → facilitator dashboard → community stats → background jobs. Local stats service is independent of the cloud components and can be developed in parallel. The facilitator dashboard is the main UI deliverable.
