"""Tests for abilities endpoints."""

import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.ability import Ability


class TestListAbilities:
    """Tests for GET /api/abilities endpoint."""

    def test_list_abilities_empty(self, client: TestClient) -> None:
        """Test listing abilities when none exist returns empty list."""
        response = client.get("/api/abilities")
        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_list_abilities_returns_all_active(
        self,
        client: TestClient,
        sample_abilities: list[Ability],
    ) -> None:
        """Test listing abilities returns all active abilities."""
        response = client.get("/api/abilities")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == len(sample_abilities)

    def test_list_abilities_excludes_inactive(
        self,
        client: TestClient,
        db_session: Session,
    ) -> None:
        """Test that inactive abilities are not returned."""
        # Create active ability
        active = Ability(
            id=uuid.uuid4(),
            type="active_ability",
            name="Active",
            description="Active ability",
            is_active=True,
        )
        # Create inactive ability
        inactive = Ability(
            id=uuid.uuid4(),
            type="inactive_ability",
            name="Inactive",
            description="Inactive ability",
            is_active=False,
        )
        db_session.add_all([active, inactive])
        db_session.commit()

        response = client.get("/api/abilities")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["type"] == "active_ability"

    def test_list_abilities_returns_expected_fields(
        self,
        client: TestClient,
        sample_ability: Ability,
    ) -> None:
        """Test that ability response includes all expected fields."""
        response = client.get("/api/abilities")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        ability = data[0]
        assert "id" in ability
        assert "type" in ability
        assert "name" in ability
        assert "description" in ability
        assert "parameters_schema" in ability
        assert "is_active" in ability
        assert "created_at" in ability


class TestGetAbilityByType:
    """Tests for GET /api/abilities/{ability_type} endpoint."""

    def test_get_ability_by_type_success(
        self,
        client: TestClient,
        sample_ability: Ability,
    ) -> None:
        """Test getting an ability by its type string."""
        response = client.get(f"/api/abilities/{sample_ability.type}")
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == sample_ability.type
        assert data["name"] == sample_ability.name

    def test_get_ability_by_type_not_found(self, client: TestClient) -> None:
        """Test getting a nonexistent ability returns 404."""
        response = client.get("/api/abilities/nonexistent_ability")
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_get_ability_returns_correct_schema(
        self,
        client: TestClient,
        sample_ability: Ability,
    ) -> None:
        """Test that ability response includes parameters_schema."""
        response = client.get(f"/api/abilities/{sample_ability.type}")
        assert response.status_code == 200
        data = response.json()
        assert "parameters_schema" in data
        assert data["parameters_schema"] == {"target": {"type": "string"}}

    def test_get_ability_case_sensitive(
        self,
        client: TestClient,
        sample_ability: Ability,
    ) -> None:
        """Test that ability type lookup is case sensitive."""
        response = client.get(f"/api/abilities/{sample_ability.type.upper()}")
        assert response.status_code == 404
