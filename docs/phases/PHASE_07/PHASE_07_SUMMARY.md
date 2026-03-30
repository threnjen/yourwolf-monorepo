# Phase 7: Analytics & Balance Metrics

**Status**: Planned
**Depends on**: Phase 06 (Advanced Features)
**Estimated complexity**: Large
**Cross-references**: None

## Objective

Build analytics infrastructure to track game outcomes, calculate role balance metrics, and provide intelligent suggestions for balanced game sets based on community play data.

## Scope

### In Scope
- Role statistics aggregation: win rate per role by team, by player count, over time periods
- Set statistics: overall balance score, game count, average duration per set
- Player count statistics: most popular sets, average game duration by player count
- Balance score calculation: roles near 50% win rate score highest
- Set recommendation engine: suggest balanced sets for a given player count
- Balance suggestion service: given a set of roles, suggest additions/removals to improve balance
- Analytics API endpoints: role performance, set recommendations, balance suggestions, community overview, facilitator dashboard
- Facilitator dashboard page: personal game stats, win distribution, frequently used roles
- Community statistics section: global game counts, popular roles, trending sets
- Background aggregation jobs: daily and weekly stats rollup
- `balance_score` column on roles table

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
| 1 | Statistics Models | RoleStatistics, SetStatistics, PlayerCountStats tables | Models, migrations |
| 2 | Stats Aggregator | Service to compute and store aggregated statistics from game history | Backend service |
| 3 | Balance Score Engine | Calculate balance score (0-100) from win rates; 50% win = highest score | Backend service |
| 4 | Recommendation Engine | Suggest sets for player count; suggest balance improvements for role sets | Backend service |
| 5 | Analytics API | Endpoints: role performance, set recommendations, balance suggestions, community overview, dashboard | Router, schemas |
| 6 | Facilitator Dashboard | Personal stats, win distribution chart, recent games, frequently used roles | Frontend page |
| 7 | Community Stats | Global aggregates, popular roles, trending sets | Frontend section |
| 8 | Background Jobs | Daily/weekly aggregation cron jobs | Job scripts, scheduler |

## Technical Context

- Game history models: `app/models/game_history.py` (from Phase 06) — source data for all aggregations
- Role model: `app/models/role.py` — needs `balance_score` column addition
- Role sets: `app/models/role_set.py` (from Phase 05) — set-level statistics
- Existing game session data in `app/models/game_session.py`
- Background jobs will need a scheduler — Python's `schedule` library or system cron for MVP; APScheduler for more control
- Aggregation queries are heavy reads; consider read replicas or materialized views if performance is an issue

## Dependencies & Risks

- **Dependency**: Phase 06 game history must be populated — analytics require completed game records
- **Dependency**: Phase 05 role sets must exist for set-level statistics
- **Risk**: Insufficient game data early on — balance scores will be unreliable with few games; mitigate by showing confidence intervals or "not enough data" states
- **Risk**: Background job reliability — cron jobs can silently fail; add logging, health checks, and alerting
- **Risk**: Aggregation query performance on large datasets — mitigate with proper indexes and periodic aggregation (not real-time)

## Success Criteria

- [ ] Role statistics are aggregated daily from game history
- [ ] Balance score reflects win rate proximity to 50% (higher = more balanced)
- [ ] Set recommendations return appropriate sets for requested player count
- [ ] Balance suggestions identify over/under-powered roles in a given set
- [ ] Facilitator dashboard shows personal game stats and win distribution
- [ ] Community overview shows global game count, popular roles, and trending sets
- [ ] Background aggregation jobs run on schedule without errors
- [ ] API endpoints handle "not enough data" gracefully

## QA Considerations

- Dashboard charts and statistics displays require manual QA
- Balance scores should be validated against manually calculated values from known game data
- Recommendation quality is subjective — QA should verify recommendations make game-sense (correct team balance, appropriate player count)
- Background job execution and failure recovery need testing

## Notes for Feature - Decomposer

Suggested decomposition: (1) statistics models + migrations, (2) stats aggregator service, (3) balance score + recommendation engine, (4) analytics API endpoints, (5) facilitator dashboard page, (6) community stats section, (7) background jobs. Features 1-3 are pure backend with no UI. Feature 4 exposes them via API. Features 5-6 are frontend-only. Feature 7 is infrastructure. The aggregator (2) and engines (3) are the core logic — everything else wraps them.
