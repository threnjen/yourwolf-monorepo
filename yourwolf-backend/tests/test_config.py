"""Tests for lazy, cached application settings."""

from collections.abc import Generator

import pytest
from app.config import Settings, get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Generator[None, None, None]:
    """Ensure each test starts from a cold settings cache."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_get_settings_returns_settings_instance(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """get_settings() builds a Settings object from the environment."""
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    settings = get_settings()
    assert isinstance(settings, Settings)
    assert settings.DATABASE_URL == "sqlite:///:memory:"


def test_get_settings_is_cached(monkeypatch: pytest.MonkeyPatch) -> None:
    """Repeated calls return the identical cached instance."""
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    assert get_settings() is get_settings()


def test_get_settings_cache_ignores_later_env_changes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Once cached, settings are not rebuilt when the environment changes."""
    monkeypatch.setenv("DATABASE_URL", "sqlite:///first.db")
    first = get_settings()
    monkeypatch.setenv("DATABASE_URL", "sqlite:///second.db")
    assert get_settings() is first
    assert get_settings().DATABASE_URL == "sqlite:///first.db"


def test_get_settings_reads_env_after_cache_clear(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Clearing the cache allows a fresh read — the hook tests rely on."""
    monkeypatch.setenv("DATABASE_URL", "sqlite:///first.db")
    get_settings()
    get_settings.cache_clear()
    monkeypatch.setenv("DATABASE_URL", "sqlite:///second.db")
    assert get_settings().DATABASE_URL == "sqlite:///second.db"


def test_config_module_has_no_import_time_settings_instance() -> None:
    """app.config must not construct Settings at import time."""
    import app.config

    assert "settings" not in vars(app.config)


def test_cors_origins_list_parses_and_strips(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """CORS origins are split on commas and stripped of whitespace."""
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("CORS_ORIGINS", "http://a.test , http://b.test")
    assert get_settings().cors_origins_list == ["http://a.test", "http://b.test"]
