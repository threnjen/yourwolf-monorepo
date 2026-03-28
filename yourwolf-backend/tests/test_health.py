"""Tests for health check endpoints."""

from collections.abc import Generator
from typing import Any
from unittest.mock import MagicMock

from app.database import get_db
from app.main import app
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_health_check_returns_healthy(self, client: TestClient) -> None:
        """Test basic health check returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data == {"status": "healthy"}

    def test_database_health_check_returns_connected(
        self,
        client: TestClient,
    ) -> None:
        """Test database health check returns connected status."""
        response = client.get("/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "connected"

    def test_health_endpoint_accepts_get_method(self, client: TestClient) -> None:
        """Test that health endpoint only accepts GET method."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_db_endpoint_accepts_get_method(self, client: TestClient) -> None:
        """Test that health/db endpoint only accepts GET method."""
        response = client.get("/health/db")
        assert response.status_code == 200

    def test_health_returns_json_content_type(self, client: TestClient) -> None:
        """Test that health endpoint returns JSON content type."""
        response = client.get("/health")
        assert "application/json" in response.headers["content-type"]

    def test_health_db_returns_json_content_type(self, client: TestClient) -> None:
        """Test that health/db endpoint returns JSON content type."""
        response = client.get("/health/db")
        assert "application/json" in response.headers["content-type"]

    def test_database_health_returns_503_on_failure(self) -> None:
        """Test DB health endpoint returns 503 when database is unreachable."""
        mock_db = MagicMock(spec=Session)
        mock_db.execute.side_effect = Exception("connection refused to host db:5432")

        def override_get_db() -> Generator[Session, Any, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db
        try:
            with TestClient(app) as test_client:
                response = test_client.get("/health/db")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "disconnected"
            assert "error" not in data
        finally:
            app.dependency_overrides.clear()
