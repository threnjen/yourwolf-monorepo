# YourWolf

> **A customizable One Night Ultimate Werewolf game facilitator with community-driven role creation**

## What is YourWolf?

YourWolf is a **game facilitator app** for in-person social deduction games based on One Night Ultimate Werewolf. Unlike traditional Werewolf apps that simply assign roles, YourWolf empowers players to **create, share, and discover custom roles** while providing intelligent tools to balance and run games.

### The Problem

Running One Night Ultimate Werewolf games requires a facilitator who knows all the roles, their wake order, and their interactions. Managing custom roles or balancing games with unusual combinations is tedious and error-prone.

### The Solution

YourWolf handles the complexity so you can focus on playing:

- **Game Facilitation**: Automated night scripts, role wake-order management, and discussion timers
- **Role Builder**: Create custom roles by composing abilities from a library of primitives
- **Balance Analytics**: Win rate tracking and suggestions for balanced role sets
- **Community**: Share roles, vote on favorites, and discover curated role sets

## How It Works

1. **Select or Create Roles**: Choose from 30 official base roles or build your own using the ability composer
2. **Start a Game**: Enter your player count and the app generates the night script
3. **Facilitate**: Let the app narrate the night phase aloud, or read the prompts yourself—either way, the timer handles the pacing
4. **Share**: Publish your custom roles for the community to vote on and use

## Key Differentiators

| Feature | Traditional Apps | YourWolf |
|---------|------------------|----------|
| Custom Roles | ❌ Fixed role sets | ✅ Build any role from ability primitives |
| Balance Insights | ❌ Trial and error | ✅ Win rate analytics and recommendations |
| Community Content | ❌ What you get is what you get | ✅ Browse, vote, and use community roles |

## Platform

- **Web App**: Full-featured React application
- **Mobile App**: React Native for iOS and Android with offline support
- **API**: FastAPI backend with PostgreSQL database

## Documentation

Detailed planning and specifications are in the [docs/](docs/) folder:

| Document | Description |
|----------|-------------|
| [ROADMAP.md](docs/ROADMAP.md) | Development phases and timeline |
| [PROJECT_SETUP.md](docs/PROJECT_SETUP.md) | One-time installation of tools and dependencies |
| [LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | Running the stack, migrations, tests, troubleshooting |
| [DATA_MODELS.md](docs/DATA_MODELS.md) | Database schemas and relationships |
| [ABILITIES.md](docs/ABILITIES.md) | Ability primitive reference |
| [SEED_ROLES.md](docs/SEED_ROLES.md) | 30 official base roles |

### Phase Documentation

| Phase | Focus |
|-------|-------|
| [Phase 1](docs/phases/PHASE_1_FOUNDATION.md) | Project foundation, data models, 30 seeded roles |
| [Phase 2](docs/phases/PHASE_2_GAME_FACILITATION.md) | Game sessions, night scripts, timer |
| [Phase 3](docs/phases/PHASE_3_ROLE_BUILDER_MVP.md) | Custom role builder |
| [Phase 4](docs/phases/PHASE_4_AUTH_USERS.md) | User authentication and profiles |
| [Phase 5](docs/phases/PHASE_5_COMMUNITY.md) | Sharing, voting, role sets |
| [Phase 6](docs/phases/PHASE_6_ADVANCED_FEATURES.md) | Conditionals, moderation, audio |
| [Phase 7](docs/phases/PHASE_7_ANALYTICS.md) | Balance metrics and suggestions |
| [Phase 8](docs/phases/PHASE_8_AWS_DEPLOYMENT.md) | AWS production deployment |
| [Phase 9](docs/phases/PHASE_9_MOBILE.md) | Mobile app with offline support |

## Getting Started

```bash
# Start development environment (run from yourwolf-backend/)
cd yourwolf-backend
docker compose up --build

# Endpoints
# Backend API: http://localhost:8000
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

See [PROJECT_SETUP.md](docs/PROJECT_SETUP.md) for first-time installation and [LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for the full command reference.

## Repository Structure

| Repository | Tech Stack | Purpose |
|------------|------------|---------|
| `yourwolf-backend` | Python 3.12, FastAPI, SQLAlchemy, PostgreSQL | REST API, game logic, ability engine |
| `yourwolf-frontend` | React 18, TypeScript, Vite | Web dashboard, role builder, facilitator UI |
| `yourwolf-docs` | Markdown, Mermaid | Planning documents, specifications |

## Future Considerations

- Discord server for community engagement and developer interaction
- Physical product line (art cards, role tiles, tokens)

