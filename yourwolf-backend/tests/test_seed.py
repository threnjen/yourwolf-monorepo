"""Tests for seed data correctness."""

from app.seed.roles import ROLES_DATA


class TestSeedWakeOrder:
    """Tests for wake_order values in seed data."""

    def test_doppelganger_wake_order_is_1(self) -> None:
        """AC12: Doppelganger wake_order should be 1, not 0."""
        doppelganger = next(r for r in ROLES_DATA if r["name"] == "Doppelganger")
        assert doppelganger["wake_order"] == 1

    def test_copycat_wake_order_is_1(self) -> None:
        """AC13: Copycat wake_order should be 1, not 0."""
        copycat = next(r for r in ROLES_DATA if r["name"] == "Copycat")
        assert copycat["wake_order"] == 1
