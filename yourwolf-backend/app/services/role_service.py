"""Role business logic service."""

import math
from uuid import UUID

from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.ability import Ability
from app.models.ability_step import AbilityStep, StepModifier
from app.models.role import Role, Team, Visibility
from app.models.role_dependency import RoleDependency
from app.models.win_condition import WinCondition
from app.schemas.role import (
    AbilityStepInRole,
    RoleCreate,
    RoleDependencyResponse,
    RoleListItem,
    RoleListResponse,
    RoleRead,
    RoleUpdate,
    WinConditionRead,
)


class RoleService:
    """Service for role-related business logic."""

    def __init__(self, db: Session) -> None:
        """Initialize the role service.

        Args:
            db: Database session.
        """
        self.db = db

    def list_roles(
        self,
        team: Team | None = None,
        visibility: Visibility | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> RoleListResponse:
        """List roles with optional filters and pagination.

        Args:
            team: Optional team filter.
            visibility: Optional visibility filter.
            page: Page number (1-indexed).
            limit: Number of items per page.

        Returns:
            Paginated list of roles.
        """
        query = self.db.query(Role)

        # Apply filters
        if team is not None:
            query = query.filter(Role.team == team)
        if visibility is not None:
            query = query.filter(Role.visibility == visibility)

        # Get total count
        total = query.count()

        # Calculate pagination
        pages = math.ceil(total / limit) if total > 0 else 1
        offset = (page - 1) * limit

        # Get paginated results with eager-loaded dependencies
        roles = (
            query.options(
                selectinload(Role.dependencies).selectinload(
                    RoleDependency.required_role
                ),
            )
            .order_by(Role.name)
            .offset(offset)
            .limit(limit)
            .all()
        )

        items = []
        for r in roles:
            dependencies = [
                RoleDependencyResponse(
                    id=dep.id,
                    required_role_id=dep.required_role_id,
                    required_role_name=(
                        dep.required_role.name if dep.required_role else "Unknown"
                    ),
                    dependency_type=dep.dependency_type,
                )
                for dep in r.dependencies
            ]
            item = RoleListItem(
                id=r.id,
                name=r.name,
                description=r.description,
                team=r.team,
                wake_order=r.wake_order,
                visibility=r.visibility,
                vote_score=r.vote_score,
                use_count=r.use_count,
                default_count=r.default_count,
                min_count=r.min_count,
                max_count=r.max_count,
                created_at=r.created_at,
                dependencies=dependencies,
            )
            items.append(item)

        return RoleListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    def get_role(self, role_id: UUID) -> RoleRead | None:
        """Get a role by ID with all related data.

        Args:
            role_id: Role UUID.

        Returns:
            Role with full details or None if not found.
        """
        role = (
            self.db.query(Role)
            .options(
                joinedload(Role.ability_steps).joinedload(AbilityStep.ability),
                joinedload(Role.win_conditions),
                joinedload(Role.dependencies).joinedload(RoleDependency.required_role),
            )
            .filter(Role.id == role_id)
            .first()
        )

        if not role:
            return None

        # Build response with ability type info
        ability_steps = []
        for step in role.ability_steps:
            step_data = AbilityStepInRole(
                id=step.id,
                ability_id=step.ability_id,
                ability_type=step.ability.type if step.ability else None,
                order=step.order,
                modifier=step.modifier.value,
                is_required=step.is_required,
                parameters=step.parameters,
                condition_type=step.condition_type,
                condition_params=step.condition_params,
            )
            ability_steps.append(step_data)

        win_conditions = [
            WinConditionRead.model_validate(wc) for wc in role.win_conditions
        ]

        dependencies = [
            RoleDependencyResponse(
                id=dep.id,
                required_role_id=dep.required_role_id,
                required_role_name=(
                    dep.required_role.name if dep.required_role else "Unknown"
                ),
                dependency_type=dep.dependency_type,
            )
            for dep in role.dependencies
        ]

        return RoleRead(
            id=role.id,
            name=role.name,
            description=role.description,
            team=role.team,
            wake_order=role.wake_order,
            wake_target=role.wake_target,
            votes=role.votes,
            default_count=role.default_count,
            min_count=role.min_count,
            max_count=role.max_count,
            visibility=role.visibility,
            is_locked=role.is_locked,
            vote_score=role.vote_score,
            use_count=role.use_count,
            creator_id=role.creator_id,
            created_at=role.created_at,
            updated_at=role.updated_at,
            published_at=role.published_at,
            ability_steps=ability_steps,
            win_conditions=win_conditions,
            dependencies=dependencies,
        )

    def create_role(self, role_data: RoleCreate) -> RoleRead:
        """Create a new role with ability steps and win conditions.

        Args:
            role_data: Role creation data.

        Returns:
            Created role with full details.
        """
        # Create the role
        role = Role(
            name=role_data.name,
            description=role_data.description,
            team=role_data.team,
            wake_order=role_data.wake_order,
            wake_target=role_data.wake_target,
            votes=role_data.votes,
            visibility=role_data.visibility,
            default_count=role_data.default_count,
            min_count=role_data.min_count,
            max_count=role_data.max_count,
        )
        self.db.add(role)
        self.db.flush()  # Get the role ID

        # Create ability steps
        for step_data in role_data.ability_steps:
            # Look up ability by type
            ability = (
                self.db.query(Ability)
                .filter(Ability.type == step_data.ability_type)
                .first()
            )
            if ability:
                step = AbilityStep(
                    role_id=role.id,
                    ability_id=ability.id,
                    order=step_data.order,
                    modifier=StepModifier(step_data.modifier),
                    is_required=step_data.is_required,
                    parameters=step_data.parameters,
                    condition_type=step_data.condition_type,
                    condition_params=step_data.condition_params,
                )
                self.db.add(step)

        # Create win conditions
        for wc_data in role_data.win_conditions:
            wc = WinCondition(
                role_id=role.id,
                condition_type=wc_data.condition_type,
                condition_params=wc_data.condition_params,
                is_primary=wc_data.is_primary,
                overrides_team=wc_data.overrides_team,
            )
            self.db.add(wc)

        self.db.commit()
        self.db.refresh(role)

        result = self.get_role(role.id)
        assert result is not None, "Role was just created, should exist"
        return result

    def update_role(self, role_id: UUID, role_data: RoleUpdate) -> RoleRead | None:
        """Update an existing role.

        Args:
            role_id: Role UUID.
            role_data: Role update data.

        Returns:
            Updated role with full details or None if not found.

        Raises:
            PermissionError: If role is locked and cannot be modified.
        """
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return None

        # Check if role is locked
        if role.is_locked:
            raise PermissionError(
                f"Role '{role.name}' is locked and cannot be modified"
            )

        # Update fields that are provided
        update_data = role_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(role, field, value)

        self.db.commit()
        self.db.refresh(role)

        return self.get_role(role.id)

    def delete_role(self, role_id: UUID) -> bool:
        """Delete a role.

        Args:
            role_id: Role UUID.

        Returns:
            True if deleted, False if not found.

        Raises:
            PermissionError: If role is locked and cannot be deleted.
        """
        role = self.db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return False

        # Check if role is locked
        if role.is_locked:
            raise PermissionError(f"Role '{role.name}' is locked and cannot be deleted")

        self.db.delete(role)
        self.db.commit()
        return True
