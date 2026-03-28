"""Game session API endpoints."""

from uuid import UUID

from app.database import get_db
from app.models.game_session import GamePhase
from app.schemas.game import (
    GameSessionCreate,
    GameSessionPaginatedResponse,
    GameSessionResponse,
    NightScript,
)
from app.services.game_service import GameService
from app.services.script_service import ScriptService
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.post(
    "", response_model=GameSessionResponse, status_code=status.HTTP_201_CREATED
)
async def create_game(
    game: GameSessionCreate,
    db: Session = Depends(get_db),
) -> GameSessionResponse:
    """Create a new game session with selected roles.

    Args:
        game: Game creation data.
        db: Database session.

    Returns:
        Created game session.

    Raises:
        HTTPException: 400 if role count doesn't match player + center.
    """
    total_cards = game.player_count + game.center_card_count
    if len(game.role_ids) != total_cards:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Must select exactly {total_cards} roles "
                f"({game.player_count} players + "
                f"{game.center_card_count} center)"
            ),
        )

    service = GameService(db)
    try:
        return service.create_game(game)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e


@router.get("", response_model=GameSessionPaginatedResponse)
async def list_games(
    phase: GamePhase | None = Query(default=None, description="Filter by phase"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> GameSessionPaginatedResponse:
    """List game sessions with optional filters.

    Args:
        phase: Optional phase filter.
        page: Page number (1-indexed).
        limit: Items per page.
        db: Database session.

    Returns:
        Paginated list of game session summaries.
    """
    service = GameService(db)
    return service.list_games(phase=phase, page=page, limit=limit)


@router.get("/{game_id}", response_model=GameSessionResponse)
async def get_game(
    game_id: UUID,
    db: Session = Depends(get_db),
) -> GameSessionResponse:
    """Get a game session by ID.

    Args:
        game_id: Game session UUID.
        db: Database session.

    Returns:
        Game session with full details.

    Raises:
        HTTPException: 404 if game not found.
    """
    service = GameService(db)
    game = service.get_game(game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game not found"
        )
    return game


@router.post("/{game_id}/start", response_model=GameSessionResponse)
async def start_game(
    game_id: UUID,
    db: Session = Depends(get_db),
) -> GameSessionResponse:
    """Start a game: randomly assign roles and advance to night.

    Args:
        game_id: Game session UUID.
        db: Database session.

    Returns:
        Updated game session.

    Raises:
        HTTPException: 400 if game is not in setup phase.
        HTTPException: 404 if game not found.
    """
    service = GameService(db)
    try:
        game = service.start_game(game_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game not found"
        )
    return game


@router.post("/{game_id}/advance", response_model=GameSessionResponse)
async def advance_phase(
    game_id: UUID,
    db: Session = Depends(get_db),
) -> GameSessionResponse:
    """Advance game to the next phase.

    Args:
        game_id: Game session UUID.
        db: Database session.

    Returns:
        Updated game session.

    Raises:
        HTTPException: 400 if game is already in complete phase.
        HTTPException: 404 if game not found.
    """
    service = GameService(db)
    try:
        game = service.advance_phase(game_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game not found"
        )
    return game


@router.get("/{game_id}/script", response_model=NightScript)
async def get_night_script(
    game_id: UUID,
    db: Session = Depends(get_db),
) -> NightScript:
    """Generate narration script for the night phase.

    Args:
        game_id: Game session UUID.
        db: Database session.

    Returns:
        Night script with ordered narrator actions.

    Raises:
        HTTPException: 404 if game not found.
    """
    game_service = GameService(db)
    game_orm = game_service.get_game_with_roles(game_id)
    if not game_orm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game not found"
        )

    script_service = ScriptService(db)
    return script_service.generate_night_script(game_orm)


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game(
    game_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    """Delete a game session.

    Args:
        game_id: Game session UUID.
        db: Database session.

    Raises:
        HTTPException: 404 if game not found.
    """
    service = GameService(db)
    if not service.delete_game(game_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game not found"
        )
