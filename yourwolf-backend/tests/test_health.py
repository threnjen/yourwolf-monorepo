"""Tests for health check endpoints."""

from fastapi.testclient import TestClient


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
