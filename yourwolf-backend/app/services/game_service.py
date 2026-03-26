"""Game session business logic service."""

import logging
import math
import random
from collections import Counter
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.game_role import GameRole
from app.models.game_session import GamePhase, GameSession
from app.models.role import Role, Team
from app.models.role_dependency import DependencyType, RoleDependency
from app.schemas.game import (
    GameRoleResponse,
    GameSessionCreate,
    GameSessionListResponse,
    GameSessionPaginatedResponse,
    GameSessionResponse,
)

logger = logging.getLogger(__name__)


class GameService:
    """Service for game session management."""

    # Phase transition order
    PHASE_ORDER = [
        GamePhase.SETUP,
        GamePhase.NIGHT,
        GamePhase.DISCUSSION,
        GamePhase.VOTING,
        GamePhase.RESOLUTION,
        GamePhase.COMPLETE,
    ]

    def __init__(self, db: Session) -> None:
        """Initialize the game service.

        Args:
            db: Database session.
        """
        self.db = db

    def create_game(self, data: GameSessionCreate) -> GameSessionResponse:
        """Create a new game session with selected roles.

        Validates card count constraints and role dependencies before creation.

        Args:
            data: Game creation data including role_ids.

        Returns:
            Created game session response (may include warnings).

        Raises:
            ValueError: If card counts or required dependencies are violated.
        """
        # Fetch roles and validate
        roles = self.db.query(Role).filter(Role.id.in_(data.role_ids)).all()
        role_map = {r.id: r for r in roles}

        # Validate card counts
        role_id_counts = Counter(data.role_ids)
        errors = []
        for role_id, count in role_id_counts.items():
            role = role_map.get(role_id)
            if not role:
                continue
            if count < role.min_count:
                errors.append(
                    f"'{role.name}' requires at least {role.min_count} "
                    f"card(s), but only {count} provided"
                )
            if count > role.max_count:
                errors.append(
                    f"'{role.name}' allows at most {role.max_count} "
                    f"card(s), but {count} provided"
                )
        if errors:
            raise ValueError("; ".join(errors))

        # Validate primary team roles
        teams_with_primary: dict[Team, bool] = {}
        for role in role_map.values():
            if role.team in (Team.VILLAGE, Team.NEUTRAL):
                continue
            if role.team not in teams_with_primary:
                teams_with_primary[role.team] = False
            if role.is_primary_team_role:
                teams_with_primary[role.team] = True

        for team, has_primary in teams_with_primary.items():
            if not has_primary:
                errors.append(
                    f"'{team.value}' team requires at least one primary role "
                    f"(e.g., Werewolf)"
                )

        if errors:
            raise ValueError("; ".join(errors))

        # Validate dependencies
        present_role_ids = set(data.role_ids)
        warnings: list[str] = []

        deps = (
            self.db.query(RoleDependency)
            .options(
                joinedload(RoleDependency.role),
                joinedload(RoleDependency.required_role),
            )
            .filter(RoleDependency.role_id.in_(present_role_ids))
            .all()
        )

        for dep in deps:
            if dep.required_role_id not in present_role_ids:
                role_name = dep.role.name if dep.role else "Unknown"
                req_name = dep.required_role.name if dep.required_role else "Unknown"
                if dep.dependency_type == DependencyType.REQUIRES:
                    errors.append(
                        f"'{role_name}' requires '{req_name}' to be in the game"
                    )
                else:
                    warnings.append(
                        f"'{role_name}' works best with '{req_name}' in the game"
                    )

        if errors:
            raise ValueError("; ".join(errors))

        # Create game
        game = GameSession(
            player_count=data.player_count,
            center_card_count=data.center_card_count,
            discussion_timer_seconds=data.discussion_timer_seconds,
            phase=GamePhase.SETUP,
        )
        self.db.add(game)
        self.db.flush()

        for role_id in data.role_ids:
            game_role = GameRole(
                game_session_id=game.id,
                role_id=role_id,
            )
            self.db.add(game_role)

        self.db.commit()
        self.db.refresh(game)
        logger.info(
            "Game %s created with %d players, %d center cards, %d roles",
            game.id,
            data.player_count,
            data.center_card_count,
            len(data.role_ids),
        )
        response = self._to_response(game)
        response.warnings = warnings
        return response

    def start_game(self, game_id: UUID) -> GameSessionResponse | None:
        """Randomly assign roles to players and center, advance to night.

        Args:
            game_id: Game session UUID.

        Returns:
            Updated game session or None if not found / wrong phase.
        """
        game = self.get_game_with_roles(game_id)
        if not game:
            logger.error("Cannot start game %s: not found", game_id)
            return None
        if game.phase != GamePhase.SETUP:
            logger.error(
                "Cannot start game %s: not in setup phase (current: %s)",
                game_id,
                game.phase.value,
            )
            raise HTTPException(
                status_code=400,
                detail="Game cannot be started: not in setup phase",
            )

        game_roles = list(game.game_roles)
        random.shuffle(game_roles)

        # Assign player positions (0 to player_count-1)
        for i in range(game.player_count):
            game_roles[i].position = i
            game_roles[i].is_center = False
            role = self.db.query(Role).filter(Role.id == game_roles[i].role_id).first()
            if role:
                game_roles[i].current_team = role.team

        # Assign center positions
        for i in range(game.player_count, len(game_roles)):
            game_roles[i].position = i - game.player_count
            game_roles[i].is_center = True

        # Increment use_count on each role used
        role_ids = [gr.role_id for gr in game_roles]
        self.db.query(Role).filter(Role.id.in_(role_ids)).update(
            {Role.use_count: Role.use_count + 1},
            synchronize_session="fetch",
        )

        game.phase = GamePhase.NIGHT
        game.started_at = datetime.now(timezone.utc)
        game.current_wake_order = 0

        self.db.commit()
        self.db.refresh(game)
        logger.info(
            "Game %s started with %d players",
            game.id,
            game.player_count,
        )
        return self._to_response(game)

    def advance_phase(self, game_id: UUID) -> GameSessionResponse | None:
        """Advance to the next game phase.

        Args:
            game_id: Game session UUID.

        Returns:
            Updated game session or None if not found.
        """
        game = self.get_game_with_roles(game_id)
        if not game:
            logger.error("Cannot advance phase for game %s: not found", game_id)
            return None

        if game.phase == GamePhase.COMPLETE:
            logger.error("Cannot advance game %s: already in complete phase", game_id)
            raise HTTPException(
                status_code=400,
                detail="Game cannot be advanced: already in complete phase",
            )

        current_index = self.PHASE_ORDER.index(game.phase)
        if current_index < len(self.PHASE_ORDER) - 1:
            old_phase = game.phase
            game.phase = self.PHASE_ORDER[current_index + 1]
            if game.phase == GamePhase.COMPLETE:
                game.ended_at = datetime.now(timezone.utc)
            logger.info(
                "Game %s advanced from %s to %s",
                game.id,
                old_phase.value,
                game.phase.value,
            )

        self.db.commit()
        self.db.refresh(game)
        return self._to_response(game)

    def get_game(self, game_id: UUID) -> GameSessionResponse | None:
        """Get a game session by ID.

        Args:
            game_id: Game session UUID.

        Returns:
            Game session response or None if not found.
        """
        game = self.get_game_with_roles(game_id)
        if not game:
            return None
        return self._to_response(game)

    def list_games(
        self,
        phase: GamePhase | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> GameSessionPaginatedResponse:
        """List game sessions with optional phase filter.

        Args:
            phase: Optional phase filter.
            page: Page number (1-indexed).
            limit: Items per page.

        Returns:
            Paginated list of game session summaries.
        """
        query = self.db.query(GameSession)
        if phase:
            query = query.filter(GameSession.phase == phase)

        total = query.count()
        pages = math.ceil(total / limit) if total > 0 else 1
        offset = (page - 1) * limit

        games = (
            query.order_by(GameSession.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return GameSessionPaginatedResponse(
            items=[GameSessionListResponse.model_validate(g) for g in games],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    def delete_game(self, game_id: UUID) -> bool:
        """Delete a game session.

        Args:
            game_id: Game session UUID.

        Returns:
            True if deleted, False if not found.
        """
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        if not game:
            logger.error("Cannot delete game %s: not found", game_id)
            return False
        self.db.delete(game)
        self.db.commit()
        logger.info("Game %s deleted", game_id)
        return True

    def get_game_with_roles(self, game_id: UUID) -> GameSession | None:
        """Load a game session with eager-loaded roles.

        Args:
            game_id: Game session UUID.

        Returns:
            Game session or None.
        """
        return (
            self.db.query(GameSession)
            .options(
                joinedload(GameSession.game_roles).joinedload(GameRole.role),
            )
            .filter(GameSession.id == game_id)
            .first()
        )

    def _to_response(self, game: GameSession) -> GameSessionResponse:
        """Convert a GameSession ORM model to a response schema.

        Args:
            game: GameSession ORM instance with loaded relationships.

        Returns:
            Serialized game session response.
        """
        game_roles = []
        for gr in game.game_roles:
            role = gr.role
            game_roles.append(
                GameRoleResponse(
                    id=gr.id,
                    role_id=gr.role_id,
                    role_name=role.name if role else "Unknown",
                    role_team=role.team.value if role else "unknown",
                    position=gr.position,
                    is_center=gr.is_center,
                    is_flipped=gr.is_flipped,
                )
            )

        return GameSessionResponse(
            id=game.id,
            player_count=game.player_count,
            center_card_count=game.center_card_count,
            discussion_timer_seconds=game.discussion_timer_seconds,
            phase=game.phase,
            current_wake_order=game.current_wake_order,
            created_at=game.created_at,
            started_at=game.started_at,
            ended_at=game.ended_at,
            game_roles=game_roles,
        )
