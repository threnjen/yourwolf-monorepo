"""Tests for roles endpoints."""

import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.ability import Ability
from app.models.role import Role


class TestListRoles:
    """Tests for GET /api/roles endpoint."""

    def test_list_roles_empty(self, client: TestClient) -> None:
        """Test listing roles when none exist returns empty list."""
        response = client.get("/api/roles")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1

    def test_list_roles_returns_all(
        self,
        client: TestClient,
        sample_roles: list[Role],
    ) -> None:
        """Test listing roles returns all roles."""
        response = client.get("/api/roles")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == len(sample_roles)

    def test_list_roles_pagination(
        self,
        client: TestClient,
        sample_roles: list[Role],
    ) -> None:
        """Test pagination with limit parameter."""
        response = client.get("/api/roles?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["limit"] == 3
        assert data["pages"] >= 1

    def test_list_roles_page_parameter(
        self,
        client: TestClient,
        sample_roles: list[Role],
    ) -> None:
        """Test pagination with page parameter."""
        response = client.get("/api/roles?page=2&limit=3")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2

    def test_list_roles_filter_by_team(
        self,
        client: TestClient,
        sample_roles: list[Role],
    ) -> None:
        """Test filtering roles by team."""
        response = client.get("/api/roles?team=werewolf")
        assert response.status_code == 200
        data = response.json()
        for role in data["items"]:
            assert role["team"] == "werewolf"

    def test_list_roles_filter_by_visibility(
        self,
        client: TestClient,
        sample_roles: list[Role],
    ) -> None:
        """Test filtering roles by visibility."""
        response = client.get("/api/roles?visibility=official")
        assert response.status_code == 200
        data = response.json()
        for role in data["items"]:
            assert role["visibility"] == "official"

    def test_list_roles_filter_by_team_and_visibility(
        self,
        client: TestClient,
        sample_roles: list[Role],
    ) -> None:
        """Test filtering roles by both team and visibility."""
        response = client.get("/api/roles?team=village&visibility=official")
        assert response.status_code == 200
        data = response.json()
        for role in data["items"]:
            assert role["team"] == "village"
            assert role["visibility"] == "official"

    def test_list_roles_invalid_page(self, client: TestClient) -> None:
        """Test invalid page parameter returns validation error."""
        response = client.get("/api/roles?page=0")
        assert response.status_code == 422

    def test_list_roles_invalid_limit(self, client: TestClient) -> None:
        """Test invalid limit parameter returns validation error."""
        response = client.get("/api/roles?limit=0")
        assert response.status_code == 422

    def test_list_roles_limit_max(self, client: TestClient) -> None:
        """Test limit parameter maximum is enforced."""
        response = client.get("/api/roles?limit=101")
        assert response.status_code == 422


class TestListOfficialRoles:
    """Tests for GET /api/roles/official endpoint."""

    def test_list_official_roles_empty(self, client: TestClient) -> None:
        """Test listing official roles when none exist."""
        response = client.get("/api/roles/official")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []

    def test_list_official_roles_only_official(
        self,
        client: TestClient,
        sample_roles: list[Role],
    ) -> None:
        """Test that only official roles are returned."""
        response = client.get("/api/roles/official")
        assert response.status_code == 200
        data = response.json()
        for role in data["items"]:
            assert role["visibility"] == "official"

    def test_list_official_roles_pagination(
        self,
        client: TestClient,
        sample_roles: list[Role],
    ) -> None:
        """Test pagination works for official roles."""
        response = client.get("/api/roles/official?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 2


class TestGetRoleById:
    """Tests for GET /api/roles/{role_id} endpoint."""

    def test_get_role_success(
        self,
        client: TestClient,
        sample_role: Role,
    ) -> None:
        """Test getting a role by ID returns correct data."""
        response = client.get(f"/api/roles/{sample_role.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_role.name
        assert data["team"] == sample_role.team.value

    def test_get_role_not_found(self, client: TestClient) -> None:
        """Test getting a nonexistent role returns 404."""
        fake_id = uuid.uuid4()
        response = client.get(f"/api/roles/{fake_id}")
        assert response.status_code == 404

    def test_get_role_invalid_uuid(self, client: TestClient) -> None:
        """Test getting a role with invalid UUID returns 422."""
        response = client.get("/api/roles/not-a-uuid")
        assert response.status_code == 422

    def test_get_role_includes_ability_steps(
        self,
        client: TestClient,
        sample_role_with_steps: Role,
    ) -> None:
        """Test that role response includes ability steps."""
        response = client.get(f"/api/roles/{sample_role_with_steps.id}")
        assert response.status_code == 200
        data = response.json()
        assert "ability_steps" in data
        assert len(data["ability_steps"]) > 0

    def test_get_role_includes_win_conditions(
        self,
        client: TestClient,
        sample_role_with_steps: Role,
    ) -> None:
        """Test that role response includes win conditions."""
        response = client.get(f"/api/roles/{sample_role_with_steps.id}")
        assert response.status_code == 200
        data = response.json()
        assert "win_conditions" in data
        assert len(data["win_conditions"]) > 0

    def test_get_role_response_fields(
        self,
        client: TestClient,
        sample_role: Role,
    ) -> None:
        """Test that role response includes all expected fields."""
        response = client.get(f"/api/roles/{sample_role.id}")
        assert response.status_code == 200
        data = response.json()
        expected_fields = [
            "id",
            "name",
            "description",
            "team",
            "wake_order",
            "votes",
            "visibility",
            "is_locked",
            "vote_score",
            "use_count",
            "created_at",
            "updated_at",
            "ability_steps",
            "win_conditions",
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"


class TestCreateRole:
    """Tests for POST /api/roles endpoint."""

    def test_create_role_minimal(
        self,
        client: TestClient,
        db_session: Session,
    ) -> None:
        """Test creating a role with minimal required fields."""
        role_data = {
            "name": "Test Role",
            "description": "A test role",
            "team": "village",
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Role"
        assert data["team"] == "village"
        assert data["visibility"] == "private"  # default

    def test_create_role_with_all_fields(
        self,
        client: TestClient,
        db_session: Session,
    ) -> None:
        """Test creating a role with all optional fields."""
        role_data = {
            "name": "Complete Role",
            "description": "A role with all fields",
            "team": "werewolf",
            "wake_order": 3,
            "wake_target": "werewolves",
            "votes": 2,
            "visibility": "public",
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Complete Role"
        assert data["wake_order"] == 3
        assert data["votes"] == 2

    def test_create_role_with_ability_steps(
        self,
        client: TestClient,
        sample_ability: Ability,
    ) -> None:
        """Test creating a role with ability steps."""
        role_data = {
            "name": "Role With Steps",
            "description": "Has ability steps",
            "team": "village",
            "ability_steps": [
                {
                    "ability_type": sample_ability.type,
                    "order": 1,
                    "modifier": "none",
                    "is_required": True,
                    "parameters": {"target": "player"},
                }
            ],
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 201
        data = response.json()
        assert len(data["ability_steps"]) == 1

    def test_create_role_with_win_conditions(
        self,
        client: TestClient,
        db_session: Session,
    ) -> None:
        """Test creating a role with win conditions."""
        role_data = {
            "name": "Role With Win Condition",
            "description": "Has win conditions",
            "team": "neutral",
            "win_conditions": [
                {
                    "condition_type": "self_dies",
                    "condition_params": {},
                    "is_primary": True,
                    "overrides_team": True,
                }
            ],
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 201
        data = response.json()
        assert len(data["win_conditions"]) == 1

    def test_create_role_missing_name(self, client: TestClient) -> None:
        """Test creating a role without name returns 422."""
        role_data = {
            "description": "Missing name",
            "team": "village",
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 422

    def test_create_role_missing_description(self, client: TestClient) -> None:
        """Test creating a role without description returns 422."""
        role_data = {
            "name": "Missing Description",
            "team": "village",
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 422

    def test_create_role_missing_team(self, client: TestClient) -> None:
        """Test creating a role without team returns 422."""
        role_data = {
            "name": "Missing Team",
            "description": "No team",
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 422

    def test_create_role_invalid_team(self, client: TestClient) -> None:
        """Test creating a role with invalid team returns 422."""
        role_data = {
            "name": "Invalid Team",
            "description": "Bad team",
            "team": "invalid_team",
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 422

    def test_create_role_name_too_long(self, client: TestClient) -> None:
        """Test creating a role with name over 100 chars returns 422."""
        role_data = {
            "name": "x" * 101,
            "description": "Name too long",
            "team": "village",
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 422


class TestUpdateRole:
    """Tests for PUT /api/roles/{role_id} endpoint."""

    def test_update_role_success(
        self,
        client: TestClient,
        sample_unlocked_role: Role,
    ) -> None:
        """Test updating an unlocked role."""
        update_data = {"name": "Updated Name"}
        response = client.put(
            f"/api/roles/{sample_unlocked_role.id}",
            json=update_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    def test_update_role_multiple_fields(
        self,
        client: TestClient,
        sample_unlocked_role: Role,
    ) -> None:
        """Test updating multiple fields."""
        update_data = {
            "name": "New Name",
            "description": "New description",
            "team": "werewolf",
        }
        response = client.put(
            f"/api/roles/{sample_unlocked_role.id}",
            json=update_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["description"] == "New description"
        assert data["team"] == "werewolf"

    def test_update_locked_role_fails(
        self,
        client: TestClient,
        sample_role: Role,
    ) -> None:
        """Test updating a locked role returns 403."""
        update_data = {"name": "Try Update"}
        response = client.put(
            f"/api/roles/{sample_role.id}",
            json=update_data,
        )
        assert response.status_code == 403

    def test_update_role_not_found(self, client: TestClient) -> None:
        """Test updating a nonexistent role returns 404."""
        fake_id = uuid.uuid4()
        update_data = {"name": "New Name"}
        response = client.put(f"/api/roles/{fake_id}", json=update_data)
        assert response.status_code == 404

    def test_update_role_partial(
        self,
        client: TestClient,
        sample_unlocked_role: Role,
    ) -> None:
        """Test partial update only modifies specified fields."""
        original_description = sample_unlocked_role.description
        update_data = {"name": "Only Name Changed"}
        response = client.put(
            f"/api/roles/{sample_unlocked_role.id}",
            json=update_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Only Name Changed"
        assert data["description"] == original_description


class TestDeleteRole:
    """Tests for DELETE /api/roles/{role_id} endpoint."""

    def test_delete_role_success(
        self,
        client: TestClient,
        sample_unlocked_role: Role,
    ) -> None:
        """Test deleting an unlocked role."""
        response = client.delete(f"/api/roles/{sample_unlocked_role.id}")
        assert response.status_code == 204

        # Verify it's deleted
        get_response = client.get(f"/api/roles/{sample_unlocked_role.id}")
        assert get_response.status_code == 404

    def test_delete_locked_role_fails(
        self,
        client: TestClient,
        sample_role: Role,
    ) -> None:
        """Test deleting a locked role returns 403."""
        response = client.delete(f"/api/roles/{sample_role.id}")
        assert response.status_code == 403

    def test_delete_role_not_found(self, client: TestClient) -> None:
        """Test deleting a nonexistent role returns 404."""
        fake_id = uuid.uuid4()
        response = client.delete(f"/api/roles/{fake_id}")
        assert response.status_code == 404

    def test_delete_role_invalid_uuid(self, client: TestClient) -> None:
        """Test deleting with invalid UUID returns 422."""
        response = client.delete("/api/roles/not-a-uuid")
        assert response.status_code == 422
