# YourWolf

> A standalone, offline-capable One Night Ultimate Werewolf clone with custom role creation and voice narration

## What is YourWolf?

YourWolf is a **game facilitator app** for in-person social deduction games based on One Night Ultimate Werewolf. The current web app uses a pure TypeScript engine for game sessions, night scripts, phase transitions, and narrator previews. IndexedDB stores the bundled role and ability catalogs, custom roles, and game snapshots. Draft validation and role-name availability checks still use the FastAPI backend. Native apps, voice narration, and cloud features remain planned.

### The Problem

Running One Night Ultimate Werewolf games requires a facilitator who knows all the roles, their wake order, and their interactions. Managing custom roles or balancing games with unusual combinations is tedious and error-prone.

### The Solution

YourWolf handles the complexity so you can focus on playing:

- **Game Facilitation**: Automated night scripts, role wake-order management, and discussion timers
- **Role Builder**: Create custom roles by composing abilities from a library of 15 primitives
- **Wake Order Review**: Drag-to-reorder roles within wake groups before starting a game
- **Client Engine**: Pure TypeScript narration, setup validation, phase-state logic, and narrator previews
- **Persistent Local Data**: IndexedDB preserves custom roles and game snapshots across browser sessions

### Planned (Future Phases)

- **Voice Narration**: Text-to-speech for the night phase, fully offline
- **Community Sharing**: Publish custom roles, vote on favorites, discover curated role sets
- **Balance Analytics**: Win rate tracking and balance suggestions

## How It Works

1. **Select or Create Roles**: Choose from 30 official base roles or build your own using the ability composer
2. **Review Wake Order**: Customize the order roles wake within each group
3. **Run the Game**: The app generates and reads the night script, manages timers, and guides each phase
4. **Play Again**: Tweak your role set and start another round

## Platform

- **Desktop App** (planned): Tauri v2 — macOS and Windows native builds, Linux best-effort
- **Mobile App** (planned): Tauri v2 — iOS and Android
- **Web**: React 18 + TypeScript (current development UI)
- **Cloud API** (planned): FastAPI backend for community features (Phase 09+)

## Getting Started

```bash
# Start the full development stack (run from yourwolf-backend/)
cd yourwolf-backend
docker compose up --build

# Endpoints
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

See [PROJECT_SETUP.md](docs/PROJECT_SETUP.md) for first-time installation and [LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for the full command reference.

## Repository Structure

```
yourwolf-monorepo/
├── yourwolf-backend/     Python 3.14, FastAPI, SQLAlchemy, PostgreSQL
│   ├── app/              Application code (models, routers, schemas, services, seed)
│   │   ├── services/narration/   Pure night-script generation (no DB)
│   │   └── seed/data/            Seed role definitions as JSON
│   ├── alembic/          Database migrations
│   └── tests/            Pytest suite (SQLite in-memory, 80% coverage threshold)
├── yourwolf-frontend/    React 18, TypeScript, Vite
│   ├── src/api/          Axios API clients
│   ├── src/adapters/     Transport and draft adapters for the engine
│   ├── src/components/   Reusable UI components
│   ├── src/context/      Repository provider and bootstrap state
│   ├── src/data/         Repository contracts, IndexedDB implementation, records, and bundled seeds
│   ├── src/domain/       Pure game rules — no React, no API (Phase 04 engine contract)
│   ├── src/engine/       Pure narration, setup validation, and session state machine
│   ├── src/hooks/        Custom React hooks
│   ├── src/pages/        Route-level page components
│   ├── src/types/        Transport DTOs and router state types
│   ├── src/utils/        Formatting and sorting helpers
│   └── src/test/         Vitest suite (jsdom, 80% coverage threshold; mirrors src/)
└── docs/                 Planning documents, phase specs, data model reference
    └── phases/           Per-phase summary documents
```

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, component diagram, data flow |
| [CODEBASE_CONTEXT.md](docs/CODEBASE_CONTEXT.md) | Dense agent-oriented codebase reference |
| [ROADMAP.md](docs/ROADMAP.md) | Development phases and timeline |
| [PROJECT_SETUP.md](docs/PROJECT_SETUP.md) | One-time installation of tools and dependencies |
| [LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | Running the stack, migrations, tests |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common errors and fixes |
| [DATA_MODELS.md](docs/DATA_MODELS.md) | Database schemas and relationships |
| [ABILITIES.md](docs/ABILITIES.md) | Ability primitive reference (15 types) |
| [SEED_ROLES.md](docs/SEED_ROLES.md) | 30 official base roles |

### Phase Documentation

| Phase | Name | Status |
|-------|------|--------|
| [01](docs/phases/PHASE_01/) | Foundation | Complete |
| [02](docs/phases/PHASE_02/) | Game Facilitation | Complete |
| [2.5](docs/phases/PHASE_2.5/) | Named Exports Migration | Complete |
| 03 | Role Builder MVP | Complete |
| [3.5](docs/phases/PHASE_3.5/) | Narrator Preview Fixes | Complete |
| [3.6](docs/phases/PHASE_3.6/) | Wake Order Resolution | Complete |
| [04a](docs/phases/PHASE_04A/) | Client-Side Game Engine | Complete |
| [04b](docs/phases/PHASE_04B/) | Engine Frontend Integration | Complete |
| [05a](docs/phases/PHASE_05A/) | Local Catalog and Store | Implementation Complete |
| 06 | Desktop App (Tauri v2) | Planned |
| 07 | Narration Engine (TTS) | Planned |
| 08 | Mobile App (Tauri v2) | Planned |
| 09 | Authentication & Users | Planned |
| 10 | Community Features | Planned |
| 11 | Advanced Features | Planned |
| 12 | Analytics & Balance | Planned |
| 13 | Production Deployment | Planned |

See [PROJECT_ROADMAP.md](docs/phases/PROJECT_ROADMAP.md) for the full roadmap with dependencies and architecture notes.
