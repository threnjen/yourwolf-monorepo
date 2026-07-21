"""FastAPI application entry point."""

from collections.abc import Awaitable, Callable

from app.config import get_settings
from app.exceptions import (
    DomainError,
    DomainValidationError,
    LockedError,
    NotFoundError,
)
from app.routers import abilities, games, health, roles
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Domain exception -> HTTP status. Only these registered types are handled;
# unexpected exceptions are left to the framework's 500 path.
_DOMAIN_ERROR_STATUS: dict[type[DomainError], int] = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    DomainValidationError: status.HTTP_400_BAD_REQUEST,
    LockedError: status.HTTP_403_FORBIDDEN,
}


def _make_domain_error_handler(
    status_code: int,
) -> Callable[[Request, Exception], Awaitable[JSONResponse]]:
    """Build a handler returning the exception message as the ``detail`` body.

    Args:
        status_code: HTTP status the handler responds with.

    Returns:
        An async Starlette exception handler.
    """

    async def handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=status_code, content={"detail": str(exc)})

    return handler


def register_exception_handlers(app: FastAPI) -> None:
    """Register domain exception handlers on a FastAPI application.

    Args:
        app: The application to register handlers on.
    """
    for exc_class, status_code in _DOMAIN_ERROR_STATUS.items():
        app.add_exception_handler(exc_class, _make_domain_error_handler(status_code))


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
    allow_origins=get_settings().cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

register_exception_handlers(app)

# Include routers
app.include_router(health.router)
app.include_router(roles.router, prefix="/api/v1/roles", tags=["roles"])
app.include_router(abilities.router, prefix="/api/v1/abilities", tags=["abilities"])
app.include_router(games.router, prefix="/api/v1/games", tags=["games"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint with API information."""
    return {
        "name": "YourWolf API",
        "version": "0.1.0",
        "docs": "/docs",
    }
