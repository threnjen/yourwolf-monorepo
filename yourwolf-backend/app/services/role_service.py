"""Role business logic service."""

import math
from uuid import UUID

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
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload


class RoleService:
    """Service for role-related business logic."""

    def __init__(self, db: Session) -> None:
        """Initialize the role service.

        Args:
            db: Database session.
        """
        self.db = db

    @staticmethod
    def _build_dependency_response(
        dep: RoleDependency,
    ) -> RoleDependencyResponse:
        return RoleDependencyResponse(
            id=dep.id,
            required_role_id=dep.required_role_id,
            required_role_name=(
                dep.required_role.name if dep.required_role else "Unknown"
            ),
            dependency_type=dep.dependency_type,
        )

    def list_roles(
        self,
        team: Team | None = None,
        visibility: list[Visibility] | Visibility | None = None,
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
            if isinstance(visibility, list):
                query = query.filter(Role.visibility.in_(visibility))
            else:
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
                self._build_dependency_response(dep) for dep in r.dependencies
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
                is_primary_team_role=r.is_primary_team_role,
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
            self._build_dependency_response(dep) for dep in role.dependencies
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
            is_primary_team_role=role.is_primary_team_role,
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
            is_primary_team_role=role_data.is_primary_team_role,
            creator_id=role_data.creator_id,
        )
        self.db.add(role)
        self.db.flush()  # Get the role ID

        # Create ability steps — batch-query abilities up front
        ability_types = [s.ability_type for s in role_data.ability_steps]
        ability_map = (
            {
                a.type: a
                for a in self.db.query(Ability)
                .filter(Ability.type.in_(ability_types))
                .all()
            }
            if ability_types
            else {}
        )

        for step_data in role_data.ability_steps:
            ability = ability_map.get(step_data.ability_type)
            if not ability:
                raise ValueError(f"Unknown ability type: '{step_data.ability_type}'")
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

        # Handle ability_steps replacement — pop before scalar setattr loop
        new_steps = update_data.pop("ability_steps", None)
        # Handle win_conditions replacement — pop before scalar setattr loop
        new_wcs = update_data.pop("win_conditions", None)

        for field, value in update_data.items():
            setattr(role, field, value)

        if new_steps is not None:
            # synchronize_session="fetch" required: "evaluate" raises
            # UnmappedInstanceError when related objects are in the session
            self.db.query(AbilityStep).filter(AbilityStep.role_id == role.id).delete(
                synchronize_session="fetch"
            )
            # Batch-query abilities up front
            step_types = [s["ability_type"] for s in new_steps]
            ability_map = (
                {
                    a.type: a
                    for a in self.db.query(Ability)
                    .filter(Ability.type.in_(step_types))
                    .all()
                }
                if step_types
                else {}
            )

            for step_data in new_steps:
                ability = ability_map.get(step_data["ability_type"])
                if not ability:
                    raise ValueError(
                        f"Unknown ability type: '{step_data['ability_type']}'"
                    )
                step = AbilityStep(
                    role_id=role.id,
                    ability_id=ability.id,
                    order=step_data["order"],
                    modifier=StepModifier(step_data.get("modifier", "none")),
                    is_required=step_data.get("is_required", True),
                    parameters=step_data.get("parameters", {}),
                    condition_type=step_data.get("condition_type"),
                    condition_params=step_data.get("condition_params"),
                )
                self.db.add(step)

        if new_wcs is not None:
            # synchronize_session="fetch" required: same reason as above
            self.db.query(WinCondition).filter(WinCondition.role_id == role.id).delete(
                synchronize_session="fetch"
            )
            for wc_data in new_wcs:
                wc = WinCondition(
                    role_id=role.id,
                    condition_type=wc_data["condition_type"],
                    condition_params=wc_data.get("condition_params"),
                    is_primary=wc_data.get("is_primary", True),
                    overrides_team=wc_data.get("overrides_team", False),
                )
                self.db.add(wc)

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

        # Official roles cannot be deleted
        if role.visibility == Visibility.OFFICIAL:
            raise PermissionError("Cannot delete official roles")

        self.db.delete(role)
        self.db.commit()
        return True

    def check_duplicate_name(
        self, name: str, exclude_role_id: UUID | None = None
    ) -> bool:
        """Check if a name is already used by a public or official role.

        Args:
            name: Role name to check.
            exclude_role_id: Optional role UUID to exclude (for update self-check).

        Returns:
            True if a duplicate exists, False otherwise.
        """
        query = self.db.query(Role).filter(
            func.lower(Role.name) == name.strip().lower(),
            Role.visibility.in_([Visibility.PUBLIC, Visibility.OFFICIAL]),
        )
        if exclude_role_id is not None:
            query = query.filter(Role.id != exclude_role_id)
        return query.first() is not None

    def validate_role(
        self, data: RoleCreate, exclude_role_id: UUID | None = None
    ) -> list[str]:
        """Validate role creation data without persisting.

        Args:
            data: Role creation payload.
            exclude_role_id: Optional role UUID to exclude from duplicate check.

        Returns:
            List of human-readable error strings. Empty list means valid.
        """
        errors: list[str] = []

        # AC3 — name length
        name = data.name.strip()
        if len(name) < 2:
            errors.append("Role name must be at least 2 characters.")
        elif len(name) > 50:
            errors.append("Role name must be at most 50 characters.")
        elif self.check_duplicate_name(name, exclude_role_id):
            # AC4 — duplicate name
            errors.append(
                f"A role named '{name}' already exists as a public or official role."
            )

        # AC5–AC7 — ability step validation
        if data.ability_steps:
            # AC6 — first step modifier must be 'none' (step with the lowest order)
            first_step = min(data.ability_steps, key=lambda s: s.order)
            if first_step.modifier != "none":
                errors.append("The first ability step must have modifier 'none'.")

            # AC5 — each ability_type must exist and be active (batch query)
            ability_types = {step.ability_type for step in data.ability_steps}
            active_abilities = (
                self.db.query(Ability)
                .filter(
                    Ability.type.in_(ability_types),
                    Ability.is_active.is_(True),
                )
                .all()
            )
            active_ability_types = {ability.type for ability in active_abilities}
            for step in data.ability_steps:
                if step.ability_type not in active_ability_types:
                    errors.append(
                        f"Ability type '{step.ability_type}' is not a valid active ability."
                    )

            # AC7 — orders must be sequential starting at 1
            orders = [step.order for step in data.ability_steps]
            sorted_orders = sorted(orders)
            expected = list(range(1, len(orders) + 1))
            if sorted_orders != expected:
                if len(orders) != len(set(orders)):
                    errors.append("Ability step orders must not have duplicates.")
                else:
                    errors.append(
                        "Ability step orders must be sequential starting at 1 with no gaps."
                    )

        # AC8–AC9 — win conditions
        if not data.win_conditions:
            errors.append("At least one win condition is required.")
        else:
            primary_count = sum(1 for wc in data.win_conditions if wc.is_primary)
            if primary_count == 0:
                errors.append("Exactly one win condition must be marked as primary.")
            elif primary_count > 1:
                errors.append(
                    f"Exactly one win condition must be marked as primary "
                    f"(found {primary_count})."
                )

        return errors

    def get_warnings(self, data: RoleCreate) -> list[str]:
        """Return non-blocking advisory warnings for role data.

        Args:
            data: Role creation payload.

        Returns:
            List of human-readable warning strings.
        """
        warnings: list[str] = []

        # AC11 — more than 5 ability steps
        if len(data.ability_steps) > 5:
            warnings.append(
                "This role has more than 5 ability steps, which may make it complex to balance."
            )

        # AC11 — steps present but no wake_order
        if data.ability_steps and data.wake_order is None:
            warnings.append(
                "This role has ability steps but no wake_order set. "
                "It may not execute its abilities without a wake order."
            )

        # AC11 — conflicting ability types
        step_types = {step.ability_type for step in data.ability_steps}
        if "copy_role" in step_types and "change_to_team" in step_types:
            warnings.append(
                "Using both 'copy_role' and 'change_to_team' abilities may cause conflicts."
            )

        return warnings
