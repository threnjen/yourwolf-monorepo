"""Tests for role validation service and endpoints (AC1–AC12)."""

import uuid

import pytest
from app.models.ability import Ability
from app.models.role import Role, Team, Visibility
from app.schemas.role import RoleCreate
from app.services.role_service import RoleService
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_valid_role(**overrides) -> dict:
    """Return a minimal valid RoleCreate payload dict."""
    defaults: dict = {
        "name": "Test Role",
        "description": "A test role",
        "team": "village",
        "visibility": "private",
        "ability_steps": [],
        "win_conditions": [{"condition_type": "team_wins", "is_primary": True}],
    }
    defaults.update(overrides)
    return defaults


# ---------------------------------------------------------------------------
# Stage 2 — Unit tests: validate_role()
# ---------------------------------------------------------------------------


class TestValidateRole:
    """Unit tests for RoleService.validate_role()."""

    def test_valid_role_passes(
        self, db_session: Session, sample_ability: Ability
    ) -> None:
        """AC1, AC3, AC5, AC8–AC9: A valid role returns no errors."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                wake_order=1,
                ability_steps=[
                    {"ability_type": "view_card", "order": 1, "modifier": "none"}
                ],
            )
        )
        errors = service.validate_role(data)
        assert errors == []

    # AC3 — name length -------------------------------------------------------

    def test_name_too_short(self, db_session: Session) -> None:
        """AC3: Name with 1 character fails validation."""
        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role(name="a"))
        errors = service.validate_role(data)
        assert any("name" in e.lower() for e in errors)

    def test_name_too_long(self, db_session: Session) -> None:
        """AC3: Name with 51 characters fails validation."""
        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role(name="a" * 51))
        errors = service.validate_role(data)
        assert any("name" in e.lower() for e in errors)

    def test_name_at_minimum_boundary(self, db_session: Session) -> None:
        """AC3: Name with exactly 2 characters passes name-length validation."""
        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role(name="ab"))
        errors = service.validate_role(data)
        assert not any("name" in e.lower() for e in errors)

    def test_name_at_maximum_boundary(self, db_session: Session) -> None:
        """AC3: Name with exactly 50 characters passes name-length validation."""
        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role(name="a" * 50))
        errors = service.validate_role(data)
        assert not any("name" in e.lower() for e in errors)

    def test_name_whitespace_only(self, db_session: Session) -> None:
        """AC3: Name that is only whitespace fails validation (empty after strip)."""
        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role(name="     "))
        errors = service.validate_role(data)
        assert any("name" in e.lower() for e in errors)

    # AC4 — duplicate name ---------------------------------------------------

    def test_duplicate_name_case_insensitive(
        self, db_session: Session, sample_role: Role
    ) -> None:
        """AC4: Duplicate name check is case-insensitive against official roles."""
        # sample_role fixture creates "Villager" with Visibility.OFFICIAL
        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role(name="villager"))
        errors = service.validate_role(data)
        assert any("already exists" in e.lower() for e in errors)

    def test_duplicate_name_private_allowed(self, db_session: Session) -> None:
        """AC4: A private role with same name as another private role is NOT a duplicate."""
        private_role = Role(
            id=uuid.uuid4(),
            name="My Custom",
            description="private role",
            team=Team.VILLAGE,
            visibility=Visibility.PRIVATE,
        )
        db_session.add(private_role)
        db_session.commit()

        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role(name="My Custom"))
        errors = service.validate_role(data)
        assert not any("already exists" in e.lower() for e in errors)

    # AC5 — ability type existence -------------------------------------------

    def test_invalid_ability_type(self, db_session: Session) -> None:
        """AC5: Step referencing a nonexistent ability type returns an error."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                wake_order=1,
                ability_steps=[
                    {
                        "ability_type": "nonexistent_ability",
                        "order": 1,
                        "modifier": "none",
                    }
                ],
            )
        )
        errors = service.validate_role(data)
        assert any("ability" in e.lower() for e in errors)

    # AC6 — first step modifier ----------------------------------------------

    def test_first_step_modifier_not_none(
        self, db_session: Session, sample_ability: Ability
    ) -> None:
        """AC6: First ability step with modifier != 'none' returns an error."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                wake_order=1,
                ability_steps=[
                    {"ability_type": "view_card", "order": 1, "modifier": "and"}
                ],
            )
        )
        errors = service.validate_role(data)
        assert any("modifier" in e.lower() for e in errors)

    # AC7 — step order validity ----------------------------------------------

    def test_duplicate_step_orders(
        self, db_session: Session, sample_ability: Ability
    ) -> None:
        """AC7: Two steps with the same order returns an error."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                wake_order=1,
                ability_steps=[
                    {"ability_type": "view_card", "order": 1, "modifier": "none"},
                    {"ability_type": "view_card", "order": 1, "modifier": "and"},
                ],
            )
        )
        errors = service.validate_role(data)
        assert any(
            "order" in e.lower()
            or "sequential" in e.lower()
            or "duplicate" in e.lower()
            for e in errors
        )

    def test_gap_in_step_orders(
        self, db_session: Session, sample_ability: Ability
    ) -> None:
        """AC7: Orders [1, 3] with gap at 2 returns an error."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                wake_order=1,
                ability_steps=[
                    {"ability_type": "view_card", "order": 1, "modifier": "none"},
                    {"ability_type": "view_card", "order": 3, "modifier": "and"},
                ],
            )
        )
        errors = service.validate_role(data)
        assert any(
            "order" in e.lower() or "sequential" in e.lower() or "gap" in e.lower()
            for e in errors
        )

    # AC8–AC9 — win conditions -----------------------------------------------

    def test_no_win_conditions(self, db_session: Session) -> None:
        """AC8: Empty win_conditions list returns an error."""
        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role(win_conditions=[]))
        errors = service.validate_role(data)
        assert any("win condition" in e.lower() for e in errors)

    def test_multiple_primary_win_conditions(self, db_session: Session) -> None:
        """AC9: Two is_primary=True win conditions returns an error."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                win_conditions=[
                    {"condition_type": "team_wins", "is_primary": True},
                    {"condition_type": "survive_night", "is_primary": True},
                ],
            )
        )
        errors = service.validate_role(data)
        assert any("primary" in e.lower() for e in errors)

    def test_no_primary_win_condition(self, db_session: Session) -> None:
        """AC9: No is_primary=True win condition returns an error."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                win_conditions=[{"condition_type": "team_wins", "is_primary": False}],
            )
        )
        errors = service.validate_role(data)
        assert any("primary" in e.lower() for e in errors)


# ---------------------------------------------------------------------------
# Stage 2 — Unit tests: check_duplicate_name()
# ---------------------------------------------------------------------------


class TestCheckDuplicateName:
    """Unit tests for RoleService.check_duplicate_name()."""

    def test_name_available(self, db_session: Session) -> None:
        """AC4: Name with no matching public/official roles returns False."""
        service = RoleService(db_session)
        assert service.check_duplicate_name("Unique Hero") is False

    def test_name_taken_official(self, db_session: Session, sample_role: Role) -> None:
        """AC4: Exact match against an official role returns True."""
        # sample_role is "Villager" with OFFICIAL visibility
        service = RoleService(db_session)
        assert service.check_duplicate_name("Villager") is True

    def test_name_taken_public(self, db_session: Session) -> None:
        """AC4: Case-insensitive match against a public role returns True."""
        public_role = Role(
            id=uuid.uuid4(),
            name="Public Hero",
            description="a public role",
            team=Team.VILLAGE,
            visibility=Visibility.PUBLIC,
        )
        db_session.add(public_role)
        db_session.commit()
        service = RoleService(db_session)
        assert service.check_duplicate_name("public hero") is True

    def test_name_excludes_role_id(
        self, db_session: Session, sample_role: Role
    ) -> None:
        """AC4: exclude_role_id prevents self-conflict during updates."""
        service = RoleService(db_session)
        assert (
            service.check_duplicate_name("Villager", exclude_role_id=sample_role.id)
            is False
        )


# ---------------------------------------------------------------------------
# Stage 2 — Unit tests: get_warnings()
# ---------------------------------------------------------------------------


class TestGetWarnings:
    """Unit tests for RoleService.get_warnings()."""

    def test_no_warnings_clean_role(self, db_session: Session) -> None:
        """AC11: A simple valid role produces no warnings."""
        service = RoleService(db_session)
        data = RoleCreate(**make_valid_role())
        warnings = service.get_warnings(data)
        assert warnings == []

    def test_warning_many_steps(self, db_session: Session) -> None:
        """AC11: More than 5 steps triggers a warning."""
        service = RoleService(db_session)
        steps = [
            {
                "ability_type": "view_card",
                "order": i + 1,
                "modifier": "none" if i == 0 else "and",
            }
            for i in range(6)
        ]
        data = RoleCreate(**make_valid_role(wake_order=1, ability_steps=steps))
        warnings = service.get_warnings(data)
        assert any("step" in w.lower() or "5" in w for w in warnings)

    def test_warning_no_wake_order_with_steps(self, db_session: Session) -> None:
        """AC11: Steps present but wake_order=None triggers a warning."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                wake_order=None,
                ability_steps=[
                    {"ability_type": "view_card", "order": 1, "modifier": "none"}
                ],
            )
        )
        warnings = service.get_warnings(data)
        assert any("wake" in w.lower() for w in warnings)

    def test_warning_conflicting_abilities(self, db_session: Session) -> None:
        """AC11: Both copy_role and change_to_team ability types triggers a warning."""
        service = RoleService(db_session)
        data = RoleCreate(
            **make_valid_role(
                wake_order=1,
                ability_steps=[
                    {"ability_type": "copy_role", "order": 1, "modifier": "none"},
                    {"ability_type": "change_to_team", "order": 2, "modifier": "and"},
                ],
            )
        )
        warnings = service.get_warnings(data)
        assert any(
            "copy_role" in w or "change_to_team" in w or "conflict" in w.lower()
            for w in warnings
        )


# ---------------------------------------------------------------------------
# Stage 3 — Integration tests: POST /api/v1/roles/validate
# ---------------------------------------------------------------------------


class TestValidateEndpoint:
    """Integration tests for POST /api/v1/roles/validate (AC1, AC12)."""

    def test_validate_endpoint_valid_role(
        self, client: TestClient, sample_ability: Ability
    ) -> None:
        """AC1: Valid role returns 200 with is_valid=true and empty errors."""
        payload = make_valid_role(
            wake_order=1,
            ability_steps=[
                {"ability_type": "view_card", "order": 1, "modifier": "none"}
            ],
        )
        response = client.post("/api/v1/roles/validate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert data["errors"] == []

    def test_validate_endpoint_invalid_role(self, client: TestClient) -> None:
        """AC1, AC12: Invalid role returns 200 with is_valid=false and non-empty errors."""
        payload = make_valid_role(name="a", win_conditions=[])
        response = client.post("/api/v1/roles/validate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False
        assert len(data["errors"]) > 0

    def test_validate_endpoint_returns_warnings(
        self, client: TestClient, sample_ability: Ability
    ) -> None:
        """AC11: Valid role with warning-triggering data returns non-empty warnings."""
        steps = [
            {
                "ability_type": "view_card",
                "order": i + 1,
                "modifier": "none" if i == 0 else "and",
            }
            for i in range(6)
        ]
        payload = make_valid_role(wake_order=1, ability_steps=steps)
        response = client.post("/api/v1/roles/validate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert data["errors"] == []
        assert len(data["warnings"]) > 0

    def test_validate_endpoint_exclude_role_id(
        self, client: TestClient, sample_role: Role
    ) -> None:
        """AC4: exclude_role_id prevents false duplicate error on edit (self-conflict)."""
        # sample_role is "Villager" OFFICIAL — would normally trigger duplicate error
        payload = make_valid_role(name="Villager")
        response = client.post(
            f"/api/v1/roles/validate?exclude_role_id={sample_role.id}", json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert not any("already exists" in e.lower() for e in data["errors"])


# ---------------------------------------------------------------------------
# Stage 3 — Integration tests: GET /api/v1/roles/check-name
# ---------------------------------------------------------------------------


class TestCheckNameEndpoint:
    """Integration tests for GET /api/v1/roles/check-name (AC2, AC4)."""

    def test_check_name_available(self, client: TestClient) -> None:
        """AC2: Novel name returns is_available=true."""
        response = client.get("/api/v1/roles/check-name?name=Unique+Name")
        assert response.status_code == 200
        data = response.json()
        assert data["is_available"] is True
        assert data["name"] == "Unique Name"
        assert "message" in data

    def test_check_name_taken(self, client: TestClient, sample_role: Role) -> None:
        """AC2, AC4: Existing official role name returns is_available=false."""
        # sample_role is "Villager" with OFFICIAL visibility
        response = client.get("/api/v1/roles/check-name?name=Villager")
        assert response.status_code == 200
        data = response.json()
        assert data["is_available"] is False

    def test_check_name_case_insensitive(
        self, client: TestClient, sample_role: Role
    ) -> None:
        """AC4: Check is case-insensitive — 'VILLAGER' matches 'Villager'."""
        response = client.get("/api/v1/roles/check-name?name=VILLAGER")
        assert response.status_code == 200
        data = response.json()
        assert data["is_available"] is False

    def test_check_name_requires_name_param(self, client: TestClient) -> None:
        """AC2: Missing name query parameter returns 422."""
        response = client.get("/api/v1/roles/check-name")
        assert response.status_code == 422

    def test_check_name_whitespace_only(self, client: TestClient) -> None:
        """AC2: Whitespace-only name returns 422 after strip."""
        response = client.get("/api/v1/roles/check-name?name=++++")
        assert response.status_code == 422
