# YourWolf

> A standalone, offline-capable One Night Ultimate Werewolf clone with custom role creation and voice narration

## What is YourWolf?

YourWolf is a **game facilitator app** for in-person social deduction games based on One Night Ultimate Werewolf. It runs natively on macOS, Windows, iOS, and Android with **no internet connection required**. Users create custom roles, run games with voice narration, and play anywhere. Cloud features (accounts, community role sharing, analytics) layer on top for connected users.

### The Problem

Running One Night Ultimate Werewolf games requires a facilitator who knows all the roles, their wake order, and their interactions. Managing custom roles or balancing games with unusual combinations is tedious and error-prone.

### The Solution

YourWolf handles the complexity so you can focus on playing:

- **Game Facilitation**: Automated night scripts, role wake-order management, and discussion timers
- **Role Builder**: Create custom roles by composing abilities from a library of 15 primitives
- **Wake Order Review**: Drag-to-reorder roles within wake groups before starting a game
- **Offline-First**: The core game runs entirely client-side — no server, no login, no internet

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
│   ├── alembic/          Database migrations
│   └── tests/            Pytest suite (SQLite in-memory, 80% coverage threshold)
├── yourwolf-frontend/    React 18, TypeScript, Vite
│   ├── src/api/          Axios API clients
│   ├── src/components/   Reusable UI components
│   ├── src/hooks/        Custom React hooks
│   ├── src/pages/        Route-level page components
│   ├── src/types/        TypeScript type definitions
│   └── src/test/         Vitest suite (jsdom, 80% coverage threshold)
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
| [03](docs/phases/PHASE_3/) | Role Builder MVP | Complete |
| [3.5](docs/phases/PHASE_3.5/) | Narrator Preview Fixes | Complete |
| [3.6](docs/phases/PHASE_3.6/) | Wake Order Resolution | Complete |
| [04](docs/phases/PHASE_04/) | Client-Side Game Engine | **Next** |
| [05](docs/phases/PHASE_05/) | Local Data Layer (SQLite) | Planned |
| [06](docs/phases/PHASE_06/) | Desktop App (Tauri v2) | Planned |
| [07](docs/phases/PHASE_07/) | Narration Engine (TTS) | Planned |
| [08](docs/phases/PHASE_08/) | Mobile App (Tauri v2) | Planned |
| [09](docs/phases/PHASE_09/) | Authentication & Users | Planned |
| [10](docs/phases/PHASE_10/) | Community Features | Planned |
| [11](docs/phases/PHASE_11/) | Advanced Features | Planned |
| [12](docs/phases/PHASE_12/) | Analytics & Balance | Planned |
| [13](docs/phases/PHASE_13/) | Production Deployment | Planned |

See [PHASES_OVERVIEW.md](docs/phases/PHASES_OVERVIEW.md) for the full roadmap with dependencies and architecture notes.

