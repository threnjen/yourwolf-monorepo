"""Tests for roles endpoints."""

import uuid

from app.models.ability import Ability
from app.models.role import Role
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


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

    def test_get_role_includes_ability_steps_and_win_conditions(
        self,
        client: TestClient,
        sample_role_with_steps: Role,
    ) -> None:
        """Test that role response includes ability steps and win conditions."""
        response = client.get(f"/api/roles/{sample_role_with_steps.id}")
        assert response.status_code == 200
        data = response.json()
        assert "ability_steps" in data
        assert len(data["ability_steps"]) > 0
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


class TestListRolesWithDependencies:
    """Tests for dependencies in list endpoint response."""

    def test_list_roles_includes_dependencies(
        self,
        client: TestClient,
        seeded_roles_with_deps: dict,
    ) -> None:
        """Test that list endpoint returns dependencies for each role."""
        response = client.get("/api/roles/official?limit=50")
        assert response.status_code == 200
        data = response.json()
        items_by_name = {item["name"]: item for item in data["items"]}

        # Apprentice Tanner should have a REQUIRES dependency on Tanner
        at = items_by_name["Apprentice Tanner"]
        assert "dependencies" in at
        assert len(at["dependencies"]) == 1
        dep = at["dependencies"][0]
        assert dep["required_role_name"] == "Tanner"
        assert dep["dependency_type"] == "requires"

        # Villager has no dependencies
        villager = items_by_name["Villager"]
        assert villager["dependencies"] == []


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

    def test_delete_official_role_fails(
        self,
        client: TestClient,
        sample_official_role: Role,
    ) -> None:
        """Test deleting an official role returns 403 with correct message."""
        response = client.delete(f"/api/roles/{sample_official_role.id}")
        assert response.status_code == 403
        assert "Cannot delete official roles" in response.json()["detail"]

    def test_delete_role_not_found(self, client: TestClient) -> None:
        """Test deleting a nonexistent role returns 404."""
        fake_id = uuid.uuid4()
        response = client.delete(f"/api/roles/{fake_id}")
        assert response.status_code == 404

    def test_delete_role_invalid_uuid(self, client: TestClient) -> None:
        """Test deleting with invalid UUID returns 422."""
        response = client.delete("/api/roles/not-a-uuid")
        assert response.status_code == 422


class TestCreateRoleOwnership:
    """Tests for creator_id in POST /api/roles endpoint."""

    def test_create_role_with_creator_id(self, client: TestClient) -> None:
        """creator_id sent in POST body is persisted and returned in the response."""
        creator_id = str(uuid.uuid4())
        role_data = {
            "name": "Owned Role",
            "description": "Role with a creator",
            "team": "village",
            "creator_id": creator_id,
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 201
        data = response.json()
        assert data["creator_id"] == creator_id

    def test_create_role_without_creator_id_is_null(self, client: TestClient) -> None:
        """Omitting creator_id results in null in the response."""
        role_data = {
            "name": "Anonymous Role",
            "description": "Role without a creator",
            "team": "village",
        }
        response = client.post("/api/roles", json=role_data)
        assert response.status_code == 201
        data = response.json()
        assert data["creator_id"] is None


class TestUpdateRoleStepsAndConditions:
    """Tests for ability step and win condition replacement via PUT /api/roles/{id}."""

    def test_update_role_replaces_ability_steps(
        self,
        client: TestClient,
        sample_unlocked_role: Role,
        sample_ability: Ability,
    ) -> None:
        """PUT with ability_steps replaces all existing steps."""
        update_data = {
            "ability_steps": [
                {
                    "ability_type": sample_ability.type,
                    "order": 1,
                    "modifier": "none",
                    "is_required": True,
                    "parameters": {},
                }
            ]
        }
        response = client.put(
            f"/api/roles/{sample_unlocked_role.id}",
            json=update_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["ability_steps"]) == 1
        assert data["ability_steps"][0]["ability_type"] == sample_ability.type

    def test_update_role_replaces_win_conditions(
        self,
        client: TestClient,
        sample_unlocked_role: Role,
    ) -> None:
        """PUT with win_conditions replaces all existing conditions."""
        update_data = {
            "win_conditions": [
                {
                    "condition_type": "self_dies",
                    "is_primary": True,
                    "overrides_team": True,
                },
                {
                    "condition_type": "team_wins",
                    "is_primary": False,
                    "overrides_team": False,
                },
            ]
        }
        response = client.put(
            f"/api/roles/{sample_unlocked_role.id}",
            json=update_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["win_conditions"]) == 2
        types = {wc["condition_type"] for wc in data["win_conditions"]}
        assert types == {"self_dies", "team_wins"}

    def test_update_role_combined_steps_and_conditions(
        self,
        client: TestClient,
        sample_unlocked_role: Role,
        sample_ability: Ability,
    ) -> None:
        """PUT with both ability_steps and win_conditions replaces both in one request."""
        update_data = {
            "ability_steps": [
                {
                    "ability_type": sample_ability.type,
                    "order": 1,
                    "modifier": "none",
                    "is_required": True,
                    "parameters": {},
                }
            ],
            "win_conditions": [
                {
                    "condition_type": "self_dies",
                    "is_primary": True,
                    "overrides_team": True,
                },
            ],
        }
        response = client.put(
            f"/api/roles/{sample_unlocked_role.id}",
            json=update_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["ability_steps"]) == 1
        assert data["ability_steps"][0]["ability_type"] == sample_ability.type
        assert len(data["win_conditions"]) == 1
        assert data["win_conditions"][0]["condition_type"] == "self_dies"

    def test_update_role_partial_leaves_win_conditions_unchanged(
        self,
        client: TestClient,
        sample_unlocked_role: Role,
        db_session,
    ) -> None:
        """PUT with only scalar fields does not touch existing win conditions."""
        from app.models.win_condition import WinCondition

        wc = WinCondition(
            id=uuid.uuid4(),
            role_id=sample_unlocked_role.id,
            condition_type="team_wins",
            is_primary=True,
            overrides_team=False,
        )
        db_session.add(wc)
        db_session.commit()
        original_wc_id = wc.id

        response = client.put(
            f"/api/roles/{sample_unlocked_role.id}",
            json={"name": "Name Only"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Name Only"
        assert len(data["win_conditions"]) == 1
        assert data["win_conditions"][0]["id"] == str(original_wc_id)

    def test_update_role_partial_leaves_steps_unchanged(
        self,
        client: TestClient,
        sample_role_with_steps: Role,
        db_session,
    ) -> None:
        """PUT with only scalar fields does not touch existing ability steps."""
        # sample_role_with_steps is locked, so use an unlocked copy
        from app.models.ability_step import AbilityStep
        from app.models.role import Role as RoleModel
        from app.models.role import Team, Visibility

        unlocked = RoleModel(
            id=uuid.uuid4(),
            name="Partial Update Role",
            description="Editable role with steps",
            team=Team.VILLAGE,
            visibility=Visibility.PRIVATE,
            is_locked=False,
        )
        db_session.add(unlocked)
        db_session.flush()
        from app.models.ability_step import StepModifier

        step = AbilityStep(
            id=uuid.uuid4(),
            role_id=unlocked.id,
            ability_id=sample_role_with_steps.ability_steps[0].ability_id,
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={},
        )
        db_session.add(step)
        db_session.commit()
        original_step_id = step.id

        response = client.put(
            f"/api/roles/{unlocked.id}",
            json={"name": "Name Only"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Name Only"
        assert len(data["ability_steps"]) == 1
        assert data["ability_steps"][0]["id"] == str(original_step_id)
