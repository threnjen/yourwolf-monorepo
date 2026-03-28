"""Tests for game session API endpoints."""

import uuid
from typing import Any

import pytest
from app.models.role import Role
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestCreateGameEndpoint:
    """Tests for POST /api/games."""

    def test_creates_game_successfully(
        self, client: TestClient, seeded_roles: list[Role]
    ) -> None:
        role_ids = [str(r.id) for r in seeded_roles[:8]]
        response = client.post(
            "/api/games",
            json={
                "player_count": 5,
                "center_card_count": 3,
                "discussion_timer_seconds": 300,
                "role_ids": role_ids,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["player_count"] == 5
        assert data["phase"] == "setup"
        assert len(data["game_roles"]) == 8

    def test_rejects_wrong_role_count(
        self, client: TestClient, seeded_roles: list[Role]
    ) -> None:
        role_ids = [str(r.id) for r in seeded_roles[:5]]
        response = client.post(
            "/api/games",
            json={
                "player_count": 5,
                "center_card_count": 3,
                "role_ids": role_ids,
            },
        )

        assert response.status_code == 400
        assert "Must select exactly 8 roles" in response.json()["detail"]


class TestGetNightScriptEndpoint:
    """Tests for GET /api/games/{id}/script."""

    def test_returns_night_script(
        self, client: TestClient, seeded_roles: list[Role]
    ) -> None:
        role_ids = [str(r.id) for r in seeded_roles[:8]]
        create_resp = client.post(
            "/api/games",
            json={"player_count": 5, "center_card_count": 3, "role_ids": role_ids},
        )
        game_id = create_resp.json()["id"]
        client.post(f"/api/games/{game_id}/start")

        response = client.get(f"/api/games/{game_id}/script")

        assert response.status_code == 200
        data = response.json()
        assert data["game_session_id"] == game_id
        assert len(data["actions"]) > 0
        assert data["total_duration_seconds"] > 0

    def test_returns_404_for_nonexistent(self, client: TestClient) -> None:
        response = client.get(f"/api/games/{uuid.uuid4()}/script")

        assert response.status_code == 404


class TestFullGameLifecycle:
    """End-to-end test for a complete game flow via the API."""

    def test_complete_game_flow(
        self, client: TestClient, seeded_roles: list[Role]
    ) -> None:
        role_ids = [str(r.id) for r in seeded_roles[:8]]

        # Create
        resp = client.post(
            "/api/games",
            json={"player_count": 5, "center_card_count": 3, "role_ids": role_ids},
        )
        assert resp.status_code == 201
        game_id = resp.json()["id"]

        # Start
        resp = client.post(f"/api/games/{game_id}/start")
        assert resp.json()["phase"] == "night"

        # Get script
        resp = client.get(f"/api/games/{game_id}/script")
        assert len(resp.json()["actions"]) > 0

        # Advance through all remaining phases
        for expected_phase in ["discussion", "voting", "resolution", "complete"]:
            resp = client.post(f"/api/games/{game_id}/advance")
            assert resp.json()["phase"] == expected_phase

        # Verify complete state
        resp = client.get(f"/api/games/{game_id}")
        assert resp.json()["phase"] == "complete"
        assert resp.json()["ended_at"] is not None


class TestCardCountValidationEndpoint:
    """Tests for card count validation via the API."""

    def test_rejects_exceeding_max_count(
        self, client: TestClient, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        role_map = seeded_roles_with_deps["role_map"]
        # 3 Werewolves exceeds max_count=2
        role_ids = [
            str(role_map["Werewolf"].id),
            str(role_map["Werewolf"].id),
            str(role_map["Werewolf"].id),
            str(role_map["Seer"].id),
            str(role_map["Villager"].id),
            str(role_map["Villager"].id),
            str(role_map["Villager"].id),
            str(role_map["Robber"].id),
        ]

        response = client.post(
            "/api/games",
            json={"player_count": 5, "center_card_count": 3, "role_ids": role_ids},
        )

        assert response.status_code == 400
        assert "at most 2" in response.json()["detail"]

    def test_rejects_below_min_count(
        self, client: TestClient, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        role_map = seeded_roles_with_deps["role_map"]
        # 1 Mason below min_count=2
        role_ids = [
            str(role_map["Mason"].id),
            str(role_map["Werewolf"].id),
            str(role_map["Werewolf"].id),
            str(role_map["Seer"].id),
            str(role_map["Robber"].id),
            str(role_map["Villager"].id),
            str(role_map["Villager"].id),
            str(role_map["Villager"].id),
        ]

        response = client.post(
            "/api/games",
            json={"player_count": 5, "center_card_count": 3, "role_ids": role_ids},
        )

        assert response.status_code == 400
        assert "at least 2" in response.json()["detail"]


class TestDependencyValidationEndpoint:
    """Tests for dependency validation via the API."""

    def test_rejects_missing_required_dep(
        self, client: TestClient, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        role_map = seeded_roles_with_deps["role_map"]
        # Apprentice Tanner without Tanner
        role_ids = [
            str(role_map["Apprentice Tanner"].id),
            str(role_map["Werewolf"].id),
            str(role_map["Werewolf"].id),
            str(role_map["Seer"].id),
            str(role_map["Robber"].id),
            str(role_map["Villager"].id),
            str(role_map["Villager"].id),
            str(role_map["Villager"].id),
        ]

        response = client.post(
            "/api/games",
            json={"player_count": 5, "center_card_count": 3, "role_ids": role_ids},
        )

        assert response.status_code == 400
        assert "requires" in response.json()["detail"]

    def test_returns_warnings_for_recommends(
        self, client: TestClient, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        role_map = seeded_roles_with_deps["role_map"]
        # Beholder without Seer — should warn but succeed
        role_ids = [
            str(role_map["Beholder"].id),
            str(role_map["Werewolf"].id),
            str(role_map["Robber"].id),
            str(role_map["Troublemaker"].id),
            str(role_map["Insomniac"].id),
            str(role_map["Villager"].id),
            str(role_map["Villager"].id),
            str(role_map["Villager"].id),
        ]

        response = client.post(
            "/api/games",
            json={"player_count": 5, "center_card_count": 3, "role_ids": role_ids},
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["warnings"]) == 1
        assert "Beholder" in data["warnings"][0]

    def test_response_includes_warnings_field(
        self, client: TestClient, seeded_roles: list[Role]
    ) -> None:
        """Test that GameSessionResponse always includes warnings array."""
        role_ids = [str(r.id) for r in seeded_roles[:8]]

        response = client.post(
            "/api/games",
            json={"player_count": 5, "center_card_count": 3, "role_ids": role_ids},
        )

        assert response.status_code == 201
        assert "warnings" in response.json()
        assert response.json()["warnings"] == []
