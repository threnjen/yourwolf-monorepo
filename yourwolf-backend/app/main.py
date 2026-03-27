"""FastAPI application entry point."""

from app.config import settings
from app.routers import abilities, games, health, roles
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="YourWolf API",
    description="Customizable One Night Ultimate Werewolf game facilitator",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(abilities.router, prefix="/api/abilities", tags=["abilities"])
app.include_router(games.router, prefix="/api/games", tags=["games"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint with API information."""
    return {
        "name": "YourWolf API",
        "version": "0.1.0",
        "docs": "/docs",
    }
