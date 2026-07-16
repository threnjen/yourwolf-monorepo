"""Tests for the domain exception vocabulary and its HTTP handler mapping."""

import pytest
from app.exceptions import (
    DomainError,
    DomainValidationError,
    LockedError,
    NotFoundError,
)
from app.main import register_exception_handlers
from fastapi import FastAPI
from fastapi.testclient import TestClient


class TestExceptionVocabulary:
    """AC1: the domain exception vocabulary."""

    @pytest.mark.parametrize(
        "exc_class",
        [NotFoundError, DomainValidationError, LockedError],
    )
    def test_subclasses_domain_error(self, exc_class: type[DomainError]) -> None:
        assert issubclass(exc_class, DomainError)

    @pytest.mark.parametrize(
        "exc_class",
        [NotFoundError, DomainValidationError, LockedError],
    )
    def test_preserves_message(self, exc_class: type[DomainError]) -> None:
        assert str(exc_class("something went wrong")) == "something went wrong"

    def test_domain_error_is_not_a_builtin_value_or_permission_error(self) -> None:
        """The vocabulary must not be catchable by the old builtin handlers.

        Subclassing ValueError/PermissionError would let a stale
        ``except ValueError`` silently re-route a NotFoundError to 400 —
        exactly the defect this feature removes.
        """
        assert not issubclass(DomainError, ValueError)
        assert not issubclass(DomainError, PermissionError)


@pytest.fixture
def handler_client() -> TestClient:
    """A throwaway app exposing one route per domain exception type."""
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/not-found")
    async def raise_not_found() -> None:
        raise NotFoundError("Game not found")

    @app.get("/invalid")
    async def raise_invalid() -> None:
        raise DomainValidationError("Game cannot be started: not in setup phase")

    @app.get("/locked")
    async def raise_locked() -> None:
        raise LockedError("Role 'Seer' is locked and cannot be modified")

    return TestClient(app)


class TestExceptionHandlerMapping:
    """AC2: each domain exception type maps to its HTTP status and body."""

    def test_not_found_maps_to_404(self, handler_client: TestClient) -> None:
        response = handler_client.get("/not-found")

        assert response.status_code == 404
        assert response.json() == {"detail": "Game not found"}

    def test_domain_validation_maps_to_400(self, handler_client: TestClient) -> None:
        response = handler_client.get("/invalid")

        assert response.status_code == 400
        assert response.json() == {
            "detail": "Game cannot be started: not in setup phase"
        }

    def test_locked_maps_to_403(self, handler_client: TestClient) -> None:
        response = handler_client.get("/locked")

        assert response.status_code == 403
        assert response.json() == {
            "detail": "Role 'Seer' is locked and cannot be modified"
        }

    def test_does_not_swallow_unexpected_exceptions(self) -> None:
        """Handlers cover only registered domain types, never a blanket Exception."""
        app = FastAPI()
        register_exception_handlers(app)

        @app.get("/boom")
        async def raise_unexpected() -> None:
            raise RuntimeError("unexpected")

        client = TestClient(app)

        with pytest.raises(RuntimeError, match="unexpected"):
            client.get("/boom")
