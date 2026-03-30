# Phase 11: Advanced Features

**Status**: Planned
**Depends on**: Phase 10 (Community Features)
**Estimated complexity**: Large
**Cross-references**: Existing ability step model `yourwolf-backend/app/models/ability_step.py`, Phase 10 publishing workflow

## Objective

Enhance the platform with advanced role creation capabilities (IF/THEN/ELSE conditional logic for ability steps), automated content moderation for community publishing, and game history tracking.

## Scope

### In Scope
- Conditional ability builder: extend AbilityStep with condition types (IF role_is, IF team_is, IF player_count, etc.), THEN/ELSE branching, and condition parameters
- Condition validator service for validating conditional step configurations
- Conditional builder UI component in the Role Builder wizard
- Update TypeScript game engine (Phase 04) to resolve conditionals during night script generation
- AWS Comprehend integration for automated content moderation on role publishing
- Moderation statuses: clean, flagged (enters queue), blocked (rejected immediately)
- Auto-moderation integrated into the Phase 10 publishing workflow
- Community flagging: users can flag inappropriate roles
- Game history model: record completed games with roles used, player count, winner, duration
- Game history stored locally in SQLite; synced to cloud when online/logged in
- Game history page with filtering by date range and outcome

### Out of Scope
- Real-time conditional resolution during live games (conditions are for script generation only)
- Custom condition types defined by users
- Video recording of games
- Exporting game history to external formats
- Social sharing of game results
- Audio narration for conditional instructions (existing TTS handles the text output)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Conditional Ability Model | Extended AbilityStep with condition_type, condition_params, else_ability_id | Model updates, migration |
| 2 | Condition Validator | Service to validate conditional step configurations | Backend + TypeScript engine |
| 3 | Conditional Builder UI | IF/THEN/ELSE builder component in Role Builder wizard | Frontend component |
| 4 | Engine Update | Update TypeScript game engine to render conditional narrator text | Engine module |
| 5 | Content Moderation Service | AWS Comprehend integration for text analysis and toxicity detection | Backend service |
| 6 | Moderation Integration | Auto-moderate on publish; flagged → queue, blocked → reject; user flagging | Publishing workflow |
| 7 | Game History Models | GameHistory table in SQLite (local) and PostgreSQL (cloud) | Models, migrations |
| 8 | Game History API | Record and retrieve game history; local + cloud sync | Service, router |
| 9 | Game History Page | Frontend page for browsing and filtering past games | Frontend page |

## Technical Context

- AbilityStep model: `app/models/ability_step.py` — already has `condition_type` and `condition_params` columns; needs THEN/ELSE extension
- Script service: `app/services/script_service.py` — `_generate_step_instruction()` already handles some conditionals
- TypeScript engine (Phase 04): `src/engine/` — instruction templates need conditional prefix rendering
- Role Builder: `src/components/RoleBuilder/` — AbilitiesStep needs conditional builder sub-component
- Publishing workflow (Phase 10): moderation check inserted before visibility change
- SQLite schema (Phase 05): needs game_history table addition
- AWS Comprehend: may produce false positives on game vocabulary ("kill", "werewolf") — needs domain allowlist

## Dependencies & Risks

- **Dependency**: Phase 10 publishing workflow must exist for moderation integration
- **Dependency**: AWS account with Comprehend access (free tier covers moderate usage)
- **Risk**: Comprehend false positives on game-specific vocabulary — mitigate with domain allowlist
- **Risk**: Conditional logic complexity in the UI — the builder must remain approachable for non-technical users
- **Risk**: Game history sync adds to the Phase 09 sync complexity — mitigate by keeping sync logic simple (local-to-cloud push, no merge conflicts for history)

## Success Criteria

- [ ] User creates a role with IF/THEN/ELSE conditional ability steps
- [ ] Condition validator catches invalid configurations
- [ ] Narrator preview renders conditional prefixes (e.g., "If you see a werewolf...")
- [ ] TypeScript engine generates correct narrator text for conditional steps
- [ ] Publishing a role triggers Comprehend analysis; clean roles publish immediately
- [ ] Flagged role content enters moderation queue
- [ ] Users can flag inappropriate community roles
- [ ] Completed games are recorded in local game history
- [ ] Game history syncs to cloud when online and logged in
- [ ] Game history page shows past games with filtering

## QA Considerations

- Conditional builder UI requires manual QA: building, editing, and deleting conditions
- Moderation: test with benign game vocabulary to verify no false positives
- Game history: test recording after game completion, persistence across restarts, sync to cloud
- Conditional roles should work in narration (Phase 07 TTS reads conditional text correctly)

## Notes for Feature - Decomposer

Three major feature groups: conditional abilities, content moderation, game history. These are largely independent and can be developed in parallel after the conditional model changes are done. Decomposition: conditional model → condition validator → conditional builder UI → engine update → moderation service → moderation integration → game history models → game history API → game history page.
