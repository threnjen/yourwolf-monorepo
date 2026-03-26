# Project Setup

> One-time installation of all tools and dependencies needed to develop YourWolf locally.

## Prerequisites

Install the following tools before anything else:

| Tool | Version | Notes |
|------|---------|-------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop/ |
| Git | Latest | https://git-scm.com/ |
| Node.js | 20+ | Only needed for frontend outside Docker |
| Python | 3.12+ | Only needed for backend outside Docker |

> **The recommended path is Docker-only.** Node.js and Python are only needed if you want to run services outside of Docker.

---

## Clone the Repository

```bash
git clone https://github.com/threnjen/yourwolf-monorepo.git
cd yourwolf-monorepo
```

Both `yourwolf-backend/` and `yourwolf-frontend/` must exist as siblings on disk. The `docker-compose.yml` in `yourwolf-backend/` references the frontend directory at `../yourwolf-frontend`.

---

## Environment Variables

### Backend

```bash
cd yourwolf-backend
cp .env.example .env
```

The defaults in `.env.example` are correct for Docker. No changes are needed for standard local development.

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://yourwolf:yourwolf_dev@db:5432/yourwolf` | Uses Docker service name `db`; change to `localhost:5432` if running outside Docker |
| `ENVIRONMENT` | `development` | |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | |

### Frontend

```bash
cd yourwolf-frontend
cp .env.example .env
```

| Variable | Default | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `http://localhost:8000` | Points to the backend API |

---

## Docker Setup (Recommended)

With Docker Desktop installed and running, no further installation is needed. All services — PostgreSQL, backend, and frontend — are built and managed by Docker Compose.

Verify Docker is available:

```bash
docker --version
docker compose version
```

Proceed to [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) to start the stack.

---

## Non-Docker Setup (Optional)

Only follow this section if you need to run services outside of Docker.

### PostgreSQL

Install PostgreSQL 16:

- **macOS**: `brew install postgresql@16`
- **Ubuntu/Debian**: `sudo apt install postgresql-16`
- **Windows**: Download the installer from https://www.postgresql.org/download/windows/

Create the development database and user:

```bash
psql -U postgres
```

```sql
CREATE USER yourwolf WITH PASSWORD 'yourwolf_dev';
CREATE DATABASE yourwolf OWNER yourwolf;
\q
```

Update `DATABASE_URL` in `yourwolf-backend/.env` to use `localhost`:

```
DATABASE_URL=postgresql://yourwolf:yourwolf_dev@localhost:5432/yourwolf
```

### Backend Python Environment

```bash
cd yourwolf-backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
```

Production dependencies (`requirements.txt`):

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `sqlalchemy` | ORM |
| `psycopg2-binary` | PostgreSQL driver |
| `alembic` | Database migrations |
| `pydantic` / `pydantic-settings` | Schema validation and config |
| `python-dotenv` | `.env` file loading |

Dev-only additions (`requirements-dev.txt`): `pytest`, `pytest-asyncio`, `pytest-cov`, `httpx`, `black`, `isort`, `mypy`.

### Frontend Node Environment

```bash
cd yourwolf-frontend
npm install
```

Key dependencies: `react 18`, `react-router-dom 6`, `axios`. Dev tooling: `vite`, `typescript`, `vitest`, `@testing-library/react`.
