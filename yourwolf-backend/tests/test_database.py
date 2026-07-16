"""Tests for database module wiring: Base location and lazy engine creation."""

import subprocess
import sys
from collections.abc import Generator
from pathlib import Path

import app.database as database_module
import pytest
from app.config import get_settings
from app.database import get_engine, get_session_factory
from app.models.base import Base as ModelsBase


def test_base_lives_in_models_base_module() -> None:
    """The declarative Base is defined in app.models.base."""
    assert ModelsBase.__module__ == "app.models.base"


def test_database_reexports_same_base_object() -> None:
    """app.database re-exports the identical Base for backward compatibility."""
    assert database_module.Base is ModelsBase


def test_all_models_register_against_relocated_base() -> None:
    """Every model's metadata belongs to the relocated Base."""
    from app.models.ability import Ability
    from app.models.ability_step import AbilityStep
    from app.models.game_role import GameRole
    from app.models.game_session import GameSession
    from app.models.role import Role
    from app.models.role_dependency import RoleDependency
    from app.models.user import User
    from app.models.win_condition import WinCondition

    models = [
        Ability,
        AbilityStep,
        GameRole,
        GameSession,
        Role,
        RoleDependency,
        User,
        WinCondition,
    ]
    for model in models:
        assert model.metadata is ModelsBase.metadata


class TestLazyEngine:
    """The engine and session factory are created lazily, exactly once."""

    @pytest.fixture(autouse=True)
    def _clear_caches(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> Generator[None, None, None]:
        """Start each test with cold settings/engine caches."""
        get_settings.cache_clear()
        get_engine.cache_clear()
        get_session_factory.cache_clear()
        monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
        yield
        get_settings.cache_clear()
        get_engine.cache_clear()
        get_session_factory.cache_clear()

    def test_no_engine_created_at_import_time(self) -> None:
        """Importing app.database must not construct an engine or factory."""
        assert "engine" not in vars(database_module)
        assert "SessionLocal" not in vars(database_module)

    def test_get_engine_is_idempotent(self) -> None:
        """The engine is created exactly once and reused."""
        assert get_engine() is get_engine()

    def test_get_session_factory_is_idempotent(self) -> None:
        """The session factory is created exactly once and reused."""
        assert get_session_factory() is get_session_factory()

    def test_session_factory_is_bound_to_the_engine(self) -> None:
        """Sessions are produced against the single lazily created engine."""
        assert get_session_factory().kw["bind"] is get_engine()

    def test_get_engine_uses_configured_database_url(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """The engine URL comes from lazily resolved settings."""
        monkeypatch.setenv("DATABASE_URL", "sqlite:///lazy.db")
        get_settings.cache_clear()
        assert get_engine().url.database == "lazy.db"

    def test_get_db_yields_and_closes_a_session(self) -> None:
        """get_db keeps its generator contract and closes the session."""
        generator = database_module.get_db()
        session = next(generator)
        assert session.is_active
        generator.close()


def test_models_import_without_database_url_set() -> None:
    """AC5: importing a model succeeds with no DATABASE_URL in the environment."""
    backend_root = Path(__file__).resolve().parents[1]
    result = subprocess.run(
        [sys.executable, "-c", "import app.models.role"],
        cwd=backend_root,
        env={"PATH": "/usr/bin:/bin"},
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
