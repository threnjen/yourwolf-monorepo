# YourWolf Backend

A customizable One Night Ultimate Werewolf game facilitator API built with FastAPI.

## Overview

YourWolf Backend provides a RESTful API for managing roles, abilities, and game configuration for One Night Ultimate Werewolf-style games. This is **Phase 1: Foundation** which establishes the core data models and CRUD operations.

## Features

- **30 Official Roles**: Pre-seeded with all official One Night Ultimate Werewolf roles
- **15 Ability Primitives**: Composable ability building blocks for custom role creation
- **Role CRUD API**: Full create, read, update, delete operations for roles
- **PostgreSQL Backend**: Robust relational database with JSONB support for flexible schemas
- **Docker Support**: Easy local development with Docker Compose

## Tech Stack

- **Python 3.12**
- **FastAPI** - Modern async web framework
- **SQLAlchemy 2.0** - ORM with type hints
- **PostgreSQL 16** - Database
- **Alembic** - Database migrations
- **pip + venv** - Dependency management
- **Docker & Docker Compose** - Containerization

## Project Structure

```
yourwolf-backend/
├── alembic/                  # Database migrations
│   ├── versions/             # Migration files
│   ├── env.py                # Alembic configuration
│   └── script.py.mako        # Migration template
├── app/
│   ├── models/               # SQLAlchemy models
│   │   ├── ability.py        # Ability primitive model
│   │   ├── ability_step.py   # Role ability step model
│   │   ├── role.py           # Role model with enums
│   │   ├── user.py           # User model
│   │   └── win_condition.py  # Win condition model
│   ├── routers/              # API route handlers
│   │   ├── abilities.py      # /api/abilities endpoints
│   │   ├── health.py         # Health check endpoints
│   │   └── roles.py          # /api/roles endpoints
│   ├── schemas/              # Pydantic schemas
│   │   ├── ability.py        # Ability DTOs
│   │   └── role.py           # Role DTOs
│   ├── seed/                 # Database seed data
│   │   ├── abilities.py      # 15 ability primitives
│   │   └── roles.py          # 30 official roles
│   ├── services/             # Business logic
│   │   └── role_service.py   # Role CRUD operations
│   ├── config.py             # Application settings
│   ├── database.py           # Database configuration
│   └── main.py               # FastAPI application
├── alembic.ini               # Alembic settings
├── docker-compose.yml        # Docker services
├── Dockerfile                # Backend container
├── requirements.txt          # Production dependencies
├── requirements-dev.txt      # Development dependencies
├── pyproject.toml            # Python project config (linting, etc.)
└── .env.example              # Environment template
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Python 3.12+ (for local development without Docker)

### Quick Start with Docker

1. **Clone and setup environment:**
   ```bash
   cd yourwolf-backend
   cp .env.example .env
   ```

2. **Start the services:**
   ```bash
   docker compose up --build
   ```

   This will:
   - Start PostgreSQL 16
   - Run database migrations
   - Seed official roles and abilities
   - Start the FastAPI server on `http://localhost:8000`

3. **View the API docs:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Local Development (without Docker)

1. **Create and activate virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements-dev.txt
   ```

3. **Start PostgreSQL** (via Docker or local install):
   ```bash
   docker compose up -d db
   ```

4. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

5. **Run migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Seed the database:**
   ```bash
   python -m app.seed
   ```

7. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

### Health

| Method | Endpoint      | Description              |
|--------|---------------|--------------------------|
| GET    | `/health`     | Basic health check       |
| GET    | `/health/db`  | Database connection test |

### Roles

| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| GET    | `/api/roles`        | List all roles       |
| GET    | `/api/roles/{id}`   | Get role by ID       |
| POST   | `/api/roles`        | Create a new role    |
| PUT    | `/api/roles/{id}`   | Update a role        |
| DELETE | `/api/roles/{id}`   | Delete a role        |

### Abilities

| Method | Endpoint                | Description           |
|--------|-------------------------|-----------------------|
| GET    | `/api/abilities`        | List all abilities    |
| GET    | `/api/abilities/{type}` | Get ability by type   |

## Database Models

### Role
Represents a game role with team affiliation, wake order, and description.

### Ability
A primitive ability action (view_card, swap_card, etc.).

### AbilityStep
Links abilities to roles with ordering and modifiers (and, or, if).

### WinCondition
Defines how a role wins (team victory, special conditions).

### User
Role creators (for community-created roles in future phases).

## Environment Variables

| Variable        | Description                          | Default                                   |
|-----------------|--------------------------------------|-------------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string         | `postgresql://yourwolf:...@localhost/...` |
| `ENVIRONMENT`   | Runtime environment                  | `development`                             |
| `CORS_ORIGINS`  | Allowed CORS origins (comma-sep)     | `http://localhost:3000`                   |

## Running Tests

```bash
# Activate virtual environment first
source .venv/bin/activate

# Run tests
pytest
```

## Generating Migrations

After modifying models:

```bash
# Activate virtual environment first
source .venv/bin/activate

alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Phase 1 Scope

This phase implements:
- ✅ Core data models (User, Role, Ability, AbilityStep, WinCondition)
- ✅ PostgreSQL database with Alembic migrations
- ✅ 30 official seeded roles with ability steps and win conditions
- ✅ 15 ability primitives
- ✅ Role CRUD API endpoints
- ✅ Ability read API endpoints
- ✅ Health check endpoints
- ✅ Docker development environment

## License

MIT