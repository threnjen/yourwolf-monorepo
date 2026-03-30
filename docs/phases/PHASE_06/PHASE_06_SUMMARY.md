# Phase 6: Advanced Features

**Status**: Planned
**Depends on**: Phase 05 (Community Features)
**Estimated complexity**: Large
**Cross-references**: None

## Objective

Enhance the platform with advanced role creation capabilities (IF/THEN/ELSE conditional logic for ability steps), automated content moderation via AWS Comprehend, optional audio narration via AWS Polly, and game history tracking with replay viewing.

## Scope

### In Scope
- Conditional ability builder: extend AbilityStep model with condition types (IF role_is, IF team_is, IF player_count, etc.), THEN/ELSE branching, and condition parameters
- Condition validator service for validating conditional step configurations
- Conditional builder UI component in the Role Builder wizard
- AWS Comprehend integration for automated content moderation on role publishing
- Moderation statuses: clean, flagged (enters queue), blocked (rejected immediately)
- Auto-moderation integrated into the publishing workflow from Phase 05
- AWS Polly integration for text-to-speech audio narration of night scripts
- S3 caching for generated audio (hash-based deduplication)
- Audio player component for playing narration in the facilitator UI
- Game history model: record completed games with roles, player count, winner, duration
- Game events model: timestamped log of actions within a game
- Game history API: list, detail, stats summary
- History page with filtering by date range and outcome

### Out of Scope
- Real-time conditional resolution during live games (conditions are for script generation only)
- Custom condition types defined by users
- Voice selection or custom audio settings
- Video recording of games
- Exporting game history to external formats
- Social sharing of game results

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Conditional Ability Model | Extended AbilityStep with condition_type, condition_params, else_ability_id | Model, migration |
| 2 | Condition Validator | Service to validate conditional step configurations and parameter requirements | Backend service |
| 3 | Conditional Builder UI | IF/THEN/ELSE builder component in the Role Builder wizard AbilitiesStep | Frontend component |
| 4 | Content Moderation Service | AWS Comprehend integration for text analysis, sentiment, and toxicity detection | Backend service |
| 5 | Moderation Integration | Auto-moderate on publish; flagged → queue, blocked → reject | Publishing workflow |
| 6 | Audio Narration Service | AWS Polly TTS generation with S3 caching and presigned URL delivery | Backend service |
| 7 | Audio Player | Frontend audio player component for night script playback | Frontend component |
| 8 | Game History Models | GameHistory and GameEvent tables with relationships | Models, migrations |
| 9 | Game History API | CRUD endpoints for recording and retrieving game history with stats | Router, service, schemas |
| 10 | Game History Page | Frontend page for browsing and filtering past games | Frontend page |

## Technical Context

- AbilityStep model: `app/models/ability_step.py` — currently has `modifier` field; needs `condition_type`, `condition_params`, `else_ability_id`
- Script service: `app/services/script_service.py` — `_generate_step_instruction()` needs to render conditional prefixes
- Role Builder: `src/components/RoleBuilder/steps/AbilitiesStep.tsx` — needs conditional builder sub-component
- Publishing (Phase 05): the publish workflow endpoint needs a moderation check inserted before visibility change
- GameSession model: `app/models/game_session.py` — game history extends this with outcome data
- AWS services: boto3 client for Comprehend and Polly; requires AWS credentials in environment
- S3: needed for audio file caching; bucket must be created (can be done manually or in Phase 08 Terraform)

## Dependencies & Risks

- **Dependency**: Phase 05 publishing workflow must exist for moderation integration
- **Dependency**: AWS account with Comprehend and Polly access; free tier covers moderate usage
- **Dependency**: S3 bucket for audio caching (can be provisioned manually before Phase 08 Terraform)
- **Risk**: AWS Comprehend may produce false positives on game-specific vocabulary (e.g., "kill", "werewolf") — mitigate with a domain-specific allowlist
- **Risk**: Polly audio generation latency (~1-3s per script) — mitigate with pre-generation on game creation and S3 caching
- **Risk**: Conditional logic complexity — the condition type enum could grow large; start with the most common conditions and expand incrementally

## Success Criteria

- [ ] User creates a role with IF/THEN/ELSE conditional ability steps
- [ ] Condition validator catches invalid configurations (missing params, invalid types)
- [ ] Narrator preview renders conditional prefixes (e.g., "If you see a werewolf...")
- [ ] Publishing a role triggers Comprehend analysis; clean roles publish immediately
- [ ] Flagged role content enters moderation queue; blocked content returns error
- [ ] Night script audio generates via Polly and is playable in the facilitator UI
- [ ] Audio is cached in S3; repeat requests return cached file
- [ ] Completed game is recorded with roles, winner, duration, and events
- [ ] Game history page shows past games with filtering
- [ ] Stats summary endpoint returns win counts and averages

## QA Considerations

- Conditional builder UI requires extensive manual QA: condition selection, parameter inputs, THEN/ELSE branching, nested conditions
- Audio player needs QA across browsers (playback, progress, volume)
- Game history page filtering and date range selection need manual testing
- Moderation false positive/negative rates should be sampled during QA

## Notes for Feature - Decomposer

Four largely independent feature areas: (1) conditionals (model + validator + UI), (2) moderation (service + publishing integration), (3) audio (service + S3 caching + player component), (4) game history (models + API + page). Each area can be decomposed further internally. The conditional builder is the most complex — consider splitting model/validator (backend) from the UI (frontend). Moderation depends on the Phase 05 publishing workflow. Audio and game history have no cross-dependencies with each other.
