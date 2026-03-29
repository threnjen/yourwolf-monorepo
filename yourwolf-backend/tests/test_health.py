"""Tests for health check endpoints."""

from collections.abc import Generator
from typing import Any
from unittest.mock import MagicMock

from app.database import get_db
from app.main import app
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError
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

    def test_database_health_returns_503_on_sqlalchemy_error(self) -> None:
        """Test DB health endpoint returns 503 when SQLAlchemyError is raised."""
        mock_db = MagicMock(spec=Session)
        mock_db.execute.side_effect = SQLAlchemyError("connection refused")

        def override_get_db() -> Generator[Session, Any, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db
        try:
            with TestClient(app) as test_client:
                response = test_client.get("/health/db")
            assert response.status_code == 503
            data = response.json()
            assert data["status"] == "disconnected"
        finally:
            app.dependency_overrides.clear()

    def test_database_health_propagates_non_sqlalchemy_error(self) -> None:
        """Test DB health endpoint does NOT catch non-SQLAlchemy errors."""
        mock_db = MagicMock(spec=Session)
        mock_db.execute.side_effect = RuntimeError("unexpected programming error")

        def override_get_db() -> Generator[Session, Any, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db
        try:
            with TestClient(app, raise_server_exceptions=False) as test_client:
                response = test_client.get("/health/db")
            assert response.status_code == 500
        finally:
            app.dependency_overrides.clear()
