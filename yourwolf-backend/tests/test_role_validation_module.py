"""Direct unit tests for the extracted role validation module.

``tests/test_role_validation.py`` covers the rules themselves and the
``/roles/validate`` endpoint. This module pins the extracted seam: the
module-level functions, the raising/advisory split, and the rule precedence
order that a multi-violation payload observes.
"""

import pytest
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.ability import Ability
from app.models.role import Role, Visibility
from app.schemas.role import RoleCreate
from app.services.role_validation import (
    check_duplicate_name,
    get_warnings,
    validate_role,
)


def make_valid_role(**overrides) -> dict:
    """Return a minimal valid RoleCreate payload dict."""
    defaults: dict = {
        "name": "Test Role",
        "description": "A test role",
        "team": "village",
        "visibility": "private",
        "ability_steps": [],
        "win_conditions": [{"condition_type": "team_wins", "is_primary": True}],
    }
    defaults.update(overrides)
    return defaults


class TestValidateRoleModule:
    """The extracted validate_role reports errors as a list, never raising."""

    def test_valid_role_returns_no_errors(
        self, db_session: Session, sample_ability: Ability
    ) -> None:
        """A valid payload validates cleanly."""
        data = RoleCreate(
            **make_valid_role(
                wake_order=1,
                ability_steps=[
                    {"ability_type": "view_card", "order": 1, "modifier": "none"}
                ],
            )
        )

        assert validate_role(db_session, data) == []

    def test_reports_errors_as_a_list_rather_than_raising(
        self, db_session: Session
    ) -> None:
        """Rule violations are returned, not raised — this is the advisory mode."""
        data = RoleCreate(**make_valid_role(win_conditions=[]))

        errors = validate_role(db_session, data)

        assert errors == ["At least one win condition is required."]

    def test_collects_multiple_independent_errors(self, db_session: Session) -> None:
        """Name and win-condition rules both report in one pass."""
        data = RoleCreate(**make_valid_role(name="  a  ", win_conditions=[]))

        errors = validate_role(db_session, data)

        assert "Role name must be at least 2 characters." in errors
        assert "At least one win condition is required." in errors


class TestRoleNameLengthBounds:
    """The name-length rules, and why only one of the two bounds is reachable.

    ``RoleCreate.name`` is declared ``min_length=2, max_length=50``, so pydantic
    rejects an over-long name before any service or module code runs. Stripping
    can only shorten a name, so a schema-valid name can never exceed 50
    characters by the time ``validate_role`` sees it — but it *can* fall under 2
    characters, because ``"  a  "`` passes ``min_length=2`` and strips to ``"a"``.
    That asymmetry is why the lower bound is enforced here and the upper bound is
    not.
    """

    def test_schema_rejects_an_over_long_name_before_validation_runs(self) -> None:
        """A >50 character name cannot be constructed, so no rule can see it."""
        with pytest.raises(ValidationError):
            RoleCreate(**make_valid_role(name="x" * 51))

    def test_whitespace_padded_short_name_reaches_the_lower_bound_rule(
        self, db_session: Session
    ) -> None:
        """A schema-valid name that strips below 2 chars is caught by the rule."""
        data = RoleCreate(**make_valid_role(name="  a  "))

        assert "Role name must be at least 2 characters." in validate_role(
            db_session, data
        )

    def test_max_length_name_is_accepted(self, db_session: Session) -> None:
        """A name at exactly the schema maximum is valid."""
        data = RoleCreate(**make_valid_role(name="x" * 50))

        assert validate_role(db_session, data) == []


class TestRoleRulePrecedence:
    """Name-rule precedence is observable and must not drift."""

    def test_length_rule_precedes_duplicate_name_rule(
        self, db_session: Session
    ) -> None:
        """A too-short name is reported instead of the duplicate-name rule.

        The name rules are an if/elif chain, so a name that is both too short
        and a duplicate reports only the length error.
        """
        existing = Role(
            name="a",
            description="Existing",
            team="village",
            visibility=Visibility.PUBLIC,
        )
        db_session.add(existing)
        db_session.commit()

        data = RoleCreate(**make_valid_role(name="  a  "))
        errors = validate_role(db_session, data)

        assert "Role name must be at least 2 characters." in errors
        assert not any("already exists" in e for e in errors)


class TestCheckDuplicateNameModule:
    """The extracted duplicate-name query."""

    def test_detects_a_public_duplicate_case_insensitively(
        self, db_session: Session, sample_role: Role
    ) -> None:
        """Duplicate detection ignores case and surrounding whitespace."""
        assert check_duplicate_name(db_session, "  villager  ") is True

    def test_unique_name_is_not_a_duplicate(self, db_session: Session) -> None:
        """A name nobody has taken is not a duplicate."""
        assert check_duplicate_name(db_session, "Unique Hero") is False

    def test_excluded_role_is_ignored(
        self, db_session: Session, sample_role: Role
    ) -> None:
        """A role does not count as its own duplicate during an update."""
        assert (
            check_duplicate_name(db_session, "Villager", exclude_role_id=sample_role.id)
            is False
        )


class TestGetWarningsModule:
    """The extracted advisory path stays non-raising."""

    def test_returns_no_warnings_for_a_plain_role(self) -> None:
        """A simple role produces no advisories."""
        data = RoleCreate(**make_valid_role())

        assert get_warnings(data) == []

    def test_warns_about_steps_without_a_wake_order(self) -> None:
        """Ability steps with no wake_order are advisory, not an error."""
        data = RoleCreate(
            **make_valid_role(
                ability_steps=[
                    {"ability_type": "view_card", "order": 1, "modifier": "none"}
                ]
            )
        )

        warnings = get_warnings(data)

        assert any("no wake_order set" in w for w in warnings)
